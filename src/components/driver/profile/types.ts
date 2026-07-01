import type { User, VehicleType } from '@/types/model'

export type { User, VehicleType }

export interface SavedVehicle {
  id: string
  licensePlate: string
  vehicleTypeId: string
}

export interface ReadonlyDriverProfileProps {
  readonly userId: string
  readonly onBack: () => void
}

export interface ReadonlyAccountFormProps {
  readonly user: User
  readonly isSubmitting: boolean
  readonly onSubmit: (data: AccountFormFields) => void
}

export interface AccountFormFields {
  fullName: string
  phone: string
  email: string
}

export interface ReadonlySavedVehiclesProps {
  readonly vehicles: SavedVehicle[]
  readonly vehicleTypes: VehicleType[]
  readonly isAdding: boolean
  readonly removingId: string | null
  readonly onAdd: (data: AddVehicleFields) => void
  readonly onRemove: (id: string) => void
}

export interface AddVehicleFields {
  licensePlate: string
  vehicleTypeId: string
  brand?: string
  model?: string
  color?: string
}
