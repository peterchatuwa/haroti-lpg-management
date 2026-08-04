import { ForbiddenException } from '@nestjs/common';
import { ShiftStatus, UserRole } from '../common/enums';
import { ShiftsService } from './shifts.service';

describe('ShiftsService approveShift', () => {
  const shiftsRepo = {
    findOne: jest.fn(),
    save: jest.fn((s) => s),
  };
  const tanksService = {
    ensureTanksForStation: jest.fn(),
    recordReading: jest.fn(),
  };
  const service = new ShiftsService(
    shiftsRepo as never,
    {} as never,
    {} as never,
    {} as never,
    tanksService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents cashier from approving own shift (AC-01 / POS-008)', async () => {
    shiftsRepo.findOne.mockResolvedValue({
      id: 's1',
      attendantId: 'att-1',
      status: ShiftStatus.PENDING_APPROVAL,
    });

    await expect(
      service.approveShift('s1', 'att-1', UserRole.STATION_MANAGER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('locks shift on supervisor approval', async () => {
    const shift = {
      id: 's1',
      attendantId: 'att-1',
      status: ShiftStatus.PENDING_APPROVAL,
    };
    shiftsRepo.findOne.mockResolvedValue(shift);

    const result = await service.approveShift(
      's1',
      'mgr-1',
      UserRole.STATION_MANAGER,
    );

    expect(result.status).toBe(ShiftStatus.CLOSED);
    expect(result.approvedById).toBe('mgr-1');
    expect(result.lockedAt).toBeInstanceOf(Date);
  });
});
