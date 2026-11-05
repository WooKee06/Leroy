import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  it("renders placeholder and value", () => {
    render(<SearchBar value="кофе" onChange={vi.fn()} placeholder="Поиск" />);
    expect(screen.getByPlaceholderText("Поиск")).toHaveValue("кофе");
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    await user.type(screen.getByRole("textbox"), "чай");

    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it("renders trailing slot", () => {
    render(
      <SearchBar
        value=""
        onChange={vi.fn()}
        trailing={<button>Фильтр</button>}
      />,
    );
    expect(screen.getByRole("button", { name: "Фильтр" })).toBeInTheDocument();
  });
});
