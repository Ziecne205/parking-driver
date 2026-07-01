export type BookStep = 'form' | 'payment' | 'confirmation'

export interface BookFormValues {
  vehicleTypeId: string
  licensePlate: string
  expectedEntryTime: string
  expectedExitTime: string
}
