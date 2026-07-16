import { test, expect } from "@playwright/test";

const bookingPayload = {
  firstname: "John",
  lastname: "Doe",
  totalprice: 150,
  depositpaid: true,
  bookingdates: {
    checkin: "2025-01-15",
    checkout: "2025-01-20",
  },
  additionalneeds: "Breakfast",
};

async function createBooking(request) {
  const res = await request.post("/booking", { data: bookingPayload });
  const body = await res.json();
  return body.bookingid;
}

async function getToken(request) {
  const res = await request.post("/auth", {
    data: { username: "admin", password: "password123" },
  });
  const body = await res.json();
  return body.token;
}

// ─── CreateBooking ────────────────────────────────────────────────────────────

test.describe("CreateBooking - POST /booking", () => {
  test("returns 200 with bookingid and full booking object matching the request", async ({
    request,
  }) => {
    const response = await request.post("/booking", { data: bookingPayload });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(typeof body.bookingid).toBe("number");
    expect(body.booking.firstname).toBe(bookingPayload.firstname);
    expect(body.booking.lastname).toBe(bookingPayload.lastname);
    expect(body.booking.totalprice).toBe(bookingPayload.totalprice);
    expect(body.booking.depositpaid).toBe(bookingPayload.depositpaid);
    expect(body.booking.bookingdates.checkin).toBe(
      bookingPayload.bookingdates.checkin,
    );
    expect(body.booking.bookingdates.checkout).toBe(
      bookingPayload.bookingdates.checkout,
    );
    expect(body.booking.additionalneeds).toBe(bookingPayload.additionalneeds);
  });

  test("returns a unique bookingid on each call", async ({ request }) => {
    const res1 = await request.post("/booking", { data: bookingPayload });
    const res2 = await request.post("/booking", { data: bookingPayload });

    const id1 = (await res1.json()).bookingid;
    const id2 = (await res2.json()).bookingid;

    expect(id1).not.toBe(id2);
  });
});

// ─── GetBooking ───────────────────────────────────────────────────────────────

test.describe("GetBooking - GET /booking/{id}", () => {
  let bookingId;

  test.beforeAll(async ({ request }) => {
    bookingId = await createBooking(request);
  });

  test("returns 200 with all booking fields matching the created booking", async ({
    request,
  }) => {
    const response = await request.get(`/booking/${bookingId}`);

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.firstname).toBe(bookingPayload.firstname);
    expect(body.lastname).toBe(bookingPayload.lastname);
    expect(body.totalprice).toBe(bookingPayload.totalprice);
    expect(body.depositpaid).toBe(bookingPayload.depositpaid);
    expect(body.bookingdates.checkin).toBe(bookingPayload.bookingdates.checkin);
    expect(body.bookingdates.checkout).toBe(
      bookingPayload.bookingdates.checkout,
    );
    expect(body.additionalneeds).toBe(bookingPayload.additionalneeds);
  });

  test("returns 404 for a non-existent booking ID", async ({ request }) => {
    const response = await request.get("/booking/999999999");

    expect(response.status()).toBe(404);
  });
});

// ─── UpdateBooking ────────────────────────────────────────────────────────────

test.describe("UpdateBooking - PUT /booking/{id}", () => {
  let bookingId;
  let token;

  const updatedPayload = {
    firstname: "Jane",
    lastname: "Smith",
    totalprice: 200,
    depositpaid: false,
    bookingdates: {
      checkin: "2025-02-01",
      checkout: "2025-02-07",
    },
    additionalneeds: "Dinner",
  };

  test.beforeAll(async ({ request }) => {
    bookingId = await createBooking(request);
    token = await getToken(request);
  });

  test("returns 200 with all fields reflecting the updated values", async ({
    request,
  }) => {
    const response = await request.put(`/booking/${bookingId}`, {
      headers: { Cookie: `token=${token}` },
      data: updatedPayload,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.firstname).toBe(updatedPayload.firstname);
    expect(body.lastname).toBe(updatedPayload.lastname);
    expect(body.totalprice).toBe(updatedPayload.totalprice);
    expect(body.depositpaid).toBe(updatedPayload.depositpaid);
    expect(body.bookingdates.checkin).toBe(updatedPayload.bookingdates.checkin);
    expect(body.bookingdates.checkout).toBe(
      updatedPayload.bookingdates.checkout,
    );
    expect(body.additionalneeds).toBe(updatedPayload.additionalneeds);
  });

  test("returns 403 when no auth token is provided", async ({ request }) => {
    const response = await request.put(`/booking/${bookingId}`, {
      data: updatedPayload,
    });

    expect(response.status()).toBe(403);
  });
});

// ─── DeleteBooking ────────────────────────────────────────────────────────────

test.describe("DeleteBooking - DELETE /booking/{id}", () => {
  let bookingId;
  let token;

  test.beforeAll(async ({ request }) => {
    bookingId = await createBooking(request);
    token = await getToken(request);
  });

  test("returns 201 and the booking is no longer retrievable afterwards", async ({
    request,
  }) => {
    const deleteResponse = await request.delete(`/booking/${bookingId}`, {
      headers: { Cookie: `token=${token}` },
    });

    expect(deleteResponse.status()).toBe(201);

    const getResponse = await request.get(`/booking/${bookingId}`);
    expect(getResponse.status()).toBe(404);
  });

  test("returns 403 when no auth token is provided", async ({ request }) => {
    const newId = await createBooking(request);
    const response = await request.delete(`/booking/${newId}`);

    expect(response.status()).toBe(403);
  });
});
