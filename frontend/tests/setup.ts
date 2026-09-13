import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));

afterEach(cleanup);
