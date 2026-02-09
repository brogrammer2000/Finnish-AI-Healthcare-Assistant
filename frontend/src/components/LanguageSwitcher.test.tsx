import { render, screen, fireEvent } from "@testing-library/react";
import { TranslationProvider } from "../i18n";
import { LanguageSwitcher } from "./LanguageSwitcher";

function renderWithProviders(ui: React.ReactElement) {
  return render(<TranslationProvider>{ui}</TranslationProvider>);
}

describe("LanguageSwitcher", () => {
  it("shows current language code and opens menu on click", () => {
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: /language/i });
    // Default language should be EN-like (en / browser)
    expect(button).toHaveTextContent(/EN|FI|SV/);

    // Open dropdown
    fireEvent.click(button);

    // Options rendered
    expect(screen.getByText(/English/i)).toBeInTheDocument();
    expect(screen.getByText(/Finnish/i)).toBeInTheDocument();
    expect(screen.getByText(/Swedish/i)).toBeInTheDocument();
  });

  it("changes language label when selecting an option", () => {
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: /language/i });
    fireEvent.click(button);

    const finnishOption = screen.getByText(/Finnish/i);
    fireEvent.click(finnishOption);

    // Button label updates to FI
    expect(button).toHaveTextContent("FI");
  });
});

