import { z } from 'zod';

export const createPropertyInputSchema = z.object({
  host_id: z.string(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  city: z.string().min(1, 'City is required'),
  neighborhood: z.string().nullable(),
  address: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  property_type: z.string().min(1, 'Property type is required'),
  guest_capacity: z.number().min(1, 'Guest capacity must be at least 1'),
  bedrooms: z.number().min(0, 'Bedrooms cannot be negative'),
  beds: z.number().min(1, 'Beds must be at least 1'),
  bathrooms: z.number().min(0, 'Bathrooms cannot be negative'),
  amenities: z.string().nullable(),
  base_price_per_night: z.number().min(0, 'Price cannot be negative'),
  currency: z.string().default('LYD'),
  has_power_backup: z.boolean().default(false),
  has_water_tank: z.boolean().default(false),
  house_rules: z.string().nullable(),
  cancellation_policy: z.string().default('moderate'),
  instant_book: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export type CreatePropertyInput = z.infer<typeof createPropertyInputSchema>;