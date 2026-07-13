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
    // Trigger shows the current language's native label
    expect(button).toHaveTextContent(/English|Suomi|Svenska/);

    // Open dropdown
    fireEvent.click(button);

    // Options rendered (labels are the native language names). "English" also
    // appears in the trigger as the current language, so it's non-unique.
    expect(screen.getAllByText("English").length).toBeGreaterThan(0);
    expect(screen.getByText("Suomi")).toBeInTheDocument();
    expect(screen.getByText("Svenska")).toBeInTheDocument();
  });

  it("changes language label when selecting an option", () => {
    renderWithProviders(<LanguageSwitcher />);

    const button = screen.getByRole("button", { name: /language/i });
    fireEvent.click(button);

    const finnishOption = screen.getByText("Suomi");
    fireEvent.click(finnishOption);

    // Button label updates to the selected language's native name
    expect(button).toHaveTextContent("Suomi");
  });
});

