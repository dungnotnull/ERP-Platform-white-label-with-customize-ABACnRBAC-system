import { BookingConcurrentModificationException } from './booking-concurrent-modification.exception';

describe('BookingConcurrentModificationException', () => {
  it('provides user-friendly message while keeping technical details in params', () => {
    const error = new BookingConcurrentModificationException('booking_1', 5, 7);

    expect(error.message).toBe(
      'Unable to update booking. It was recently modified by someone else. Please refresh the page to see the latest changes and try again.',
    );
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe('BOOKING_CONCURRENT_MODIFICATION');
    expect(error.params).toEqual({
      bookingId: 'booking_1',
      expectedVersion: '5',
      actualVersion: '7',
    });
  });
});
