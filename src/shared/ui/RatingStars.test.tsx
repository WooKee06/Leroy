import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import RatingStars from "./RatingStars";

describe("RatingStars", () => {
  it("renders exactly 5 stars", () => {
    render(<RatingStars rating={3.5} />);
    expect(screen.getAllByText("★")).toHaveLength(5);
  });

  it("announces rating for screen readers", () => {
    render(<RatingStars rating={3.5} />);
    expect(screen.getByLabelText("Рейтинг 3.5 из 5")).toBeInTheDocument();
  });

  it("shows the rating value with one decimal", () => {
    render(<RatingStars rating={3.5} />);
    expect(screen.getByText("3.5")).toBeInTheDocument();
  });
});
