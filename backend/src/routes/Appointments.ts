import { Router } from 'express';
import { authenticateToken, AuthRequest, isAdmin } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Hardcoded doctors and time slots for simplicity
const DOCTORS = [
  { id: 'dr-virtanen', name: 'Dr. Virtanen', specialty: 'General Practitioner' },
  { id: 'dr-korhonen', name: 'Dr. Korhonen', specialty: 'General Practitioner' },
  { id: 'nurse-makinen', name: 'Nurse Mäkinen', specialty: 'Nurse' }
];

const SERVICE_TYPES = [
  'General Consultation',
  'Follow-up Visit',
  'Nurse Consultation',
  'Specialist Referral'
];

// Generate available time slots (9 AM - 5 PM, 30-min intervals)
function generateTimeSlots(date: Date) {
  const slots = [];
  const baseDate = new Date(date);
  baseDate.setHours(9, 0, 0, 0);

  for (let hour = 9; hour < 17; hour++) {
    for (let minute of [0, 30]) {
      const slot = new Date(baseDate);
      slot.setHours(hour, minute);
      slots.push(slot.toISOString());
    }
  }
  return slots;
}

// Get available slots for a specific date and doctor
router.get('/available-slots', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date, doctorId } = req.query;

    if (!date || !doctorId) {
      return res.status(400).json({ error: 'Date and doctorId required' });
    }

    const selectedDate = new Date(date as string);
    const allSlots = generateTimeSlots(selectedDate);

    // Get booked appointments for this doctor on this date
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorName: DOCTORS.find(d => d.id === doctorId)?.name,
        datetime: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          not: 'cancelled'
        }
      },
      select: { datetime: true }
    });

    const bookedTimes = bookedAppointments.map(apt => apt.datetime.toISOString());
    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    res.json({ availableSlots, doctor: DOCTORS.find(d => d.id === doctorId) });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// Get all doctors
router.get('/doctors', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ doctors: DOCTORS });
});

// Get service types
router.get('/service-types', authenticateToken, async (req: AuthRequest, res) => {
  res.json({ serviceTypes: SERVICE_TYPES });
});

// Create appointment
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { doctorId, datetime, serviceType, aiRecommendation } = req.body;

    if (!doctorId || !datetime || !serviceType) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const doctor = DOCTORS.find(d => d.id === doctorId);
    if (!doctor) {
      return res.status(400).json({ error: 'Invalid doctor' });
    }

    // Check if slot is available
    const appointmentTime = new Date(datetime);
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        doctorName: doctor.name,
        datetime: appointmentTime,
        status: { not: 'cancelled' }
      }
    });

    if (existingAppointment) {
      return res.status(400).json({ error: 'This time slot is already booked' });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.user!.id,
        doctorName: doctor.name,
        serviceType,
        datetime: appointmentTime,
        aiRecommendation: aiRecommendation || null,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({ appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Get user's appointments
router.get('/my-appointments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user!.id },
      orderBy: { datetime: 'desc' }
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Cancel appointment
router.patch('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Appointment ID required' });

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Check if user owns this appointment
    if (appointment.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    res.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

// Admin: Get all appointments
router.get('/all', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { datetime: 'desc' }
    });

    res.json({ appointments });
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Admin: Update appointment status
router.patch('/:id/status', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) return res.status(400).json({ error: 'Appointment ID required' });
    const { status } = req.body;

    if (!['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status }
    });

    res.json({ appointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

export default router;