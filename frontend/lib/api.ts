class ApiError extends Error {}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");
export async function request<T>(path: string, body?: unknown): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers:
        body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      const safeErrors: Record<number, string> = {
        422: "Check the required fields and their allowed values.",
        429: "Today's AI allowance is used. Enter filters manually or try tomorrow (UTC).",
        502: "AI could not extract this brief. Try again or enter filters manually.",
        503: "This service is unavailable. If AI extraction failed, you can still enter filters manually.",
      };
      throw new ApiError(
        safeErrors[response.status] ||
          "Something went wrong. Please try again.",
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error(
      "Could not reach the service. Check the connection and try again.",
      { cause: error },
    );
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
