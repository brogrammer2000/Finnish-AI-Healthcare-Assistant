import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TranslationProvider } from "../i18n";

vi.mock("../context/AuthContext", () => {
  return {
    useAuth: () => ({
      user: { name: "Test User", role: "patient" },
      logout: vi.fn(),
    }),
  };
});

import Home from "./Home";
import { describe, expect, it, vi } from "vitest";

function renderHome() {
  return render(
    <TranslationProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </TranslationProvider>,
  );
}

describe("Home page", () => {
  it("shows hero greeting with user name", () => {
    renderHome();

    expect(screen.getByText(/Welcome back, Test User!/i)).toBeInTheDocument();
  });

  it("updates hero copy when switching to Swedish", () => {
    renderHome();

    const langButton = screen.getByRole("button", { name: /Language/i });
    fireEvent.click(langButton);

    const swedishOption = screen.getByText(/Swedish/i);
    fireEvent.click(swedishOption);

    expect(
      screen.getByText(/Välkommen tillbaka, Test User!/i),
    ).toBeInTheDocument();
  });
});
