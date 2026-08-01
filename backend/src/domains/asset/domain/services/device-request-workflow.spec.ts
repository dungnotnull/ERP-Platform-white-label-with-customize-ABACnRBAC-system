import { DeviceRequestWorkflow } from './device-request-workflow';
import { DeviceRequestStatusEnum } from '@/shared/domain/enums/device.enum';

describe('DeviceRequestWorkflow', () => {
  let workflow: DeviceRequestWorkflow;

  beforeEach(() => {
    workflow = new DeviceRequestWorkflow();
  });

  describe('canTransitionFrom()', () => {
    it('should allow PENDING -> APPROVED', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.PENDING, DeviceRequestStatusEnum.APPROVED)).toBe(true);
    });

    it('should allow PENDING -> REJECTED', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.PENDING, DeviceRequestStatusEnum.REJECTED)).toBe(true);
    });

    it('should allow PENDING -> CANCELLED', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.PENDING, DeviceRequestStatusEnum.CANCELLED)).toBe(true);
    });

    it('should allow APPROVED -> COMPLETED', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.APPROVED, DeviceRequestStatusEnum.COMPLETED)).toBe(true);
    });

    it('should allow APPROVED -> CANCELLED', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.APPROVED, DeviceRequestStatusEnum.CANCELLED)).toBe(true);
    });

    it('should reject PENDING -> COMPLETED (invalid skip)', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.PENDING, DeviceRequestStatusEnum.COMPLETED)).toBe(false);
    });

    it('should reject REJECTED -> APPROVED (no reversal)', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.REJECTED, DeviceRequestStatusEnum.APPROVED)).toBe(false);
    });

    it('should reject COMPLETED -> APPROVED (terminal state)', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.COMPLETED, DeviceRequestStatusEnum.APPROVED)).toBe(false);
    });

    it('should reject COMPLETED -> any', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.COMPLETED, DeviceRequestStatusEnum.CANCELLED)).toBe(false);
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.COMPLETED, DeviceRequestStatusEnum.REJECTED)).toBe(false);
    });

    it('should reject CANCELLED -> any', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.CANCELLED, DeviceRequestStatusEnum.APPROVED)).toBe(false);
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.CANCELLED, DeviceRequestStatusEnum.PENDING)).toBe(false);
    });

    it('should reject REJECTED -> any', () => {
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.REJECTED, DeviceRequestStatusEnum.PENDING)).toBe(false);
      expect(workflow.canTransitionFrom(DeviceRequestStatusEnum.REJECTED, DeviceRequestStatusEnum.CANCELLED)).toBe(false);
    });
  });

  describe('getAllowedTransitions()', () => {
    it('should return correct transitions for PENDING', () => {
      const transitions = workflow.getAllowedTransitions(DeviceRequestStatusEnum.PENDING);
      expect(transitions).toEqual([
        DeviceRequestStatusEnum.APPROVED,
        DeviceRequestStatusEnum.REJECTED,
        DeviceRequestStatusEnum.CANCELLED,
      ]);
    });

    it('should return empty array for terminal states', () => {
      expect(workflow.getAllowedTransitions(DeviceRequestStatusEnum.REJECTED)).toEqual([]);
      expect(workflow.getAllowedTransitions(DeviceRequestStatusEnum.COMPLETED)).toEqual([]);
      expect(workflow.getAllowedTransitions(DeviceRequestStatusEnum.CANCELLED)).toEqual([]);
    });
  });
});
