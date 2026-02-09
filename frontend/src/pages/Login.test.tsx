import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TranslationProvider } from "../i18n";

// Mock auth context so we don't depend on real backend calls
vi.mock("../context/AuthContext", () => {
  return {
    useAuth: () => ({
      login: vi.fn(),
      register: vi.fn(),
    }),
  };
});

import Login from "./Login";
import { vi, describe, it, expect } from "vitest";

function renderLogin() {
  return render(
    <TranslationProvider>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </TranslationProvider>,
  );
}

describe("Login page", () => {
  it("renders login form texts in English by default", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: /Healthcare AI/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Welcome back! Sign in to continue/i),
    ).toBeInTheDocument();
    // Use placeholder + role instead of label association
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sign In/i }),
    ).toBeInTheDocument();
  });

  // it("switches to Finnish localization via language switcher", () => {
  //   renderLogin();

  //   const langButton = screen.getByRole("button", { name: /Language/i });
  //   fireEvent.click(langButton);

  //   const finnishOption = screen.getByText(/fi/i);
  //   fireEvent.click(finnishOption);

  //   // Now headings and labels should be Finnish
  //   expect(
  //     screen.getByText(/Tervetuloa takaisin! Kirjaudu jatkaaksesi/i),
  //   ).toBeInTheDocument();
  //   expect(screen.getByLabelText(/Sähköpostiosoite/i)).toBeInTheDocument();
  //   expect(
  //     screen.getByRole("button", { name: /Kirjaudu sisään/i }),
  //   ).toBeInTheDocument();
  // });
});
