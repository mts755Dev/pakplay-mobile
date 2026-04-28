// Mobile app data fetching utilities
// React Native version of Next.js server-actions.ts
// These functions connect directly to Supabase from mobile device

import { supabase } from '../config/supabase';
import { Tables } from '../types/supabase';

type Venue = Tables<'venues'>;
type VenuePhoto = Tables<'venue_photos'>;
type VenueReview = Tables<'venue_reviews'>;
type SpecialOffer = Tables<'special_offers'>;
type Booking = Tables<'bookings'>;
type Profile = Tables<'profiles'>;

// ==================== VENUE DATA FETCHING ====================

export interface VenueWithData extends Venue {
  venue_photos: VenuePhoto[];
  active_offer?: SpecialOffer | null;
  active_offers?: SpecialOffer[];
  calculated_rating?: number;
  review_count?: number;
  reviews?: VenueReview[];
}

/**
 * Fetch a single venue by slug with all related data
 */
export async function fetchVenueBySlug(slug: string): Promise<VenueWithData | null> {
  try {
    const { data: venue, error } = await supabase
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('slug', slug)
      .eq('status', 'approved')
      .single();

    if (error || !venue) return null;

    venue.venue_photos.sort((a, b) => a.display_order - b.display_order);

    const [reviewsResult, offerResult] = await Promise.all([
      supabase
        .from('venue_reviews')
        .select('*')
        .eq('venue_id', venue.id)
        .order('date', { ascending: false }),
      supabase
        .from('special_offers')
        .select('*')
        .eq('venue_id', venue.id)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    return {
      ...venue,
      reviews: reviewsResult.data || [],
      active_offer: offerResult.data || null,
      calculated_rating: reviewsResult.data && reviewsResult.data.length > 0
        ? reviewsResult.data.reduce((acc, r) => acc + r.rating, 0) / reviewsResult.data.length
        : 0,
      review_count: reviewsResult.data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching venue:', error);
    return null;
  }
}

/**
 * Fetch a single venue by ID with all related data
 */
export async function fetchVenueById(venueId: string): Promise<VenueWithData | null> {
  try {
    const { data: venue, error } = await supabase
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('id', venueId)
      .eq('status', 'approved')
      .single();

    if (error || !venue) return null;

    venue.venue_photos.sort((a, b) => a.display_order - b.display_order);

    const [reviewsResult, offersResult] = await Promise.all([
      supabase
        .from('venue_reviews')
        .select('*')
        .eq('venue_id', venue.id)
        .order('date', { ascending: false }),
      supabase
        .from('special_offers')
        .select('*')
        .eq('venue_id', venue.id)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString())
        .order('created_at', { ascending: false })
    ]);

    const allActiveOffers = offersResult.data || [];

    return {
      ...venue,
      reviews: reviewsResult.data || [],
      active_offer: allActiveOffers.length > 0 ? allActiveOffers[0] : null,
      active_offers: allActiveOffers,
      calculated_rating: reviewsResult.data && reviewsResult.data.length > 0
        ? reviewsResult.data.reduce((acc, r) => acc + r.rating, 0) / reviewsResult.data.length
        : 0,
      review_count: reviewsResult.data?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching venue:', error);
    return null;
  }
}

/**
 * Fetch featured venues for homepage
 */
export async function fetchFeaturedVenues(limit: number = 9): Promise<VenueWithData[]> {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('status', 'approved')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    const venueIds = data.map(v => v.id);
    if (venueIds.length === 0) return [];

    const [offersResult, reviewsResult] = await Promise.all([
      supabase
        .from('special_offers')
        .select('*')
        .in('venue_id', venueIds)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString()),
      supabase
        .from('venue_reviews')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
    ]);

    const offersMap = new Map<string, SpecialOffer>();
    (offersResult.data || []).forEach(offer => {
      if (!offersMap.has(offer.venue_id)) {
        offersMap.set(offer.venue_id, offer);
      }
    });

    const ratingsMap = new Map<string, { total: number; count: number }>();
    (reviewsResult.data || []).forEach(review => {
      if (!ratingsMap.has(review.venue_id)) {
        ratingsMap.set(review.venue_id, { total: 0, count: 0 });
      }
      const current = ratingsMap.get(review.venue_id)!;
      current.total += review.rating;
      current.count += 1;
    });

    const venuesWithData = data.map(venue => {
      const offer = offersMap.get(venue.id);
      const rating = ratingsMap.get(venue.id);

      return {
        ...venue,
        active_offer: offer || null,
        calculated_rating: rating ? rating.total / rating.count : 0,
        review_count: rating ? rating.count : 0,
      };
    });

    venuesWithData.sort((a, b) => b.calculated_rating - a.calculated_rating);
    return venuesWithData;
  } catch (error) {
    console.error('Error fetching featured venues:', error);
    return [];
  }
}

/**
 * Fetch initial venues for browse page with filters
 */
export async function fetchInitialVenues(
  limit: number = 12,
  sportType?: string,
  searchQuery?: string,
  page: number = 1,
  province?: string,
  city?: string,
  area?: string,
  priceSort?: string,
  minPrice?: number,
  maxPrice?: number
) {
  try {
    const offset = (page - 1) * limit;
    console.log('[fetchInitialVenues] Starting fetch with params:', { 
      limit, sportType, searchQuery, page, offset, province, city, area, priceSort, minPrice, maxPrice 
    });
    
    let query = supabase
      .from('venues')
      .select(`
        id, name, slug, address, city, province, area, sub_area,
        sport_type, price_per_hour, opening_time, closing_time, is_24_7, created_at,
        owner_id, description, amenities, whatsapp_number, google_maps_url, featured,
        status, rating, total_bookings, updated_at,
        logo_url, tagline, facebook_url, instagram_url
      `, { count: 'exact' })
      .eq('status', 'approved');

    // Apply sport filter (exact match since input is normalized)
    if (sportType && sportType !== 'all') {
      console.log('[fetchInitialVenues] Applying sport filter:', sportType);
      query = query.eq('sport_type', sportType);
    }

    // Apply search filter (still use pattern matching for search)
    if (searchQuery && searchQuery.trim()) {
      console.log('[fetchInitialVenues] Applying search filter:', searchQuery);
      query = query.or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%,area.ilike.%${searchQuery}%`);
    }

    // Apply province filter (exact match since input is normalized)
    if (province && province.trim()) {
      console.log('[fetchInitialVenues] Applying province filter:', province);
      query = query.eq('province', province);
    }

    // Apply city filter (exact match since input is normalized)
    if (city && city.trim()) {
      console.log('[fetchInitialVenues] Applying city filter:', city);
      query = query.eq('city', city);
    }

    // Apply area filter (exact match since input is normalized)
    if (area && area.trim()) {
      console.log('[fetchInitialVenues] Applying area filter:', area);
      query = query.eq('area', area);
    }

    // Apply price filters
    if (minPrice !== undefined && minPrice > 0) {
      console.log('[fetchInitialVenues] Applying min price filter:', minPrice);
      query = query.gte('price_per_hour', minPrice);
    }

    if (maxPrice !== undefined && maxPrice > 0) {
      console.log('[fetchInitialVenues] Applying max price filter:', maxPrice);
      query = query.lte('price_per_hour', maxPrice);
    }

    // Apply sorting
    if (priceSort === 'low-to-high') {
      console.log('[fetchInitialVenues] Sorting by price: low to high');
      query = query.order('price_per_hour', { ascending: true });
    } else if (priceSort === 'high-to-low') {
      console.log('[fetchInitialVenues] Sorting by price: high to low');
      query = query.order('price_per_hour', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: venues, error, count } = await query;

    console.log('[fetchInitialVenues] Query result:', { 
      venuesCount: venues?.length || 0, 
      totalCount: count, 
      hasError: !!error 
    });

    if (error) {
      console.error('[fetchInitialVenues] Supabase error:', error);
      throw new Error(`Failed to fetch venues: ${error.message}`);
    }

    if (!venues) {
      console.warn('[fetchInitialVenues] No venues data returned');
      return { venues: [], totalCount: 0 };
    }

    // Log first few venues for debugging filters
    if (venues.length > 0) {
      console.log('[fetchInitialVenues] Sample venue:', {
        name: venues[0].name,
        sport: venues[0].sport_type,
        province: venues[0].province,
        city: venues[0].city,
        area: venues[0].area,
        sub_area: venues[0].sub_area
      });
      
      // Log all unique areas if filtering by area (for debugging)
      if (area && venues.length < 10) {
        const areasList = venues.map(v => ({ 
          name: v.name, 
          area: v.area, 
          sub_area: v.sub_area 
        }));
        console.log('[fetchInitialVenues] All venues with areas:', areasList);
      }
    }

    const venueIds = venues.map(v => v.id);
    if (venueIds.length === 0) {
      console.log('[fetchInitialVenues] No venues found, returning empty');
      return { venues: [], totalCount: count || 0 };
    }

    console.log('[fetchInitialVenues] Fetching additional data for', venueIds.length, 'venues');

    const [photosResult, offersResult, reviewsResult] = await Promise.all([
      supabase
        .from('venue_photos')
        .select('*')
        .in('venue_id', venueIds)
        .order('display_order', { ascending: true }),
      supabase
        .from('special_offers')
        .select('*')
        .in('venue_id', venueIds)
        .eq('is_active', true)
        .lte('valid_from', new Date().toISOString())
        .gte('valid_until', new Date().toISOString()),
      supabase
        .from('venue_reviews')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
    ]);

    const photosMap = new Map<string, VenuePhoto[]>();
    (photosResult.data || []).forEach(photo => {
      if (!photosMap.has(photo.venue_id)) {
        photosMap.set(photo.venue_id, []);
      }
      photosMap.get(photo.venue_id)!.push(photo);
    });

    const offersMap = new Map<string, SpecialOffer>();
    (offersResult.data || []).forEach(offer => {
      if (!offersMap.has(offer.venue_id)) {
        offersMap.set(offer.venue_id, offer);
      }
    });

    const ratingsMap = new Map<string, { total: number; count: number }>();
    (reviewsResult.data || []).forEach(review => {
      if (!ratingsMap.has(review.venue_id)) {
        ratingsMap.set(review.venue_id, { total: 0, count: 0 });
      }
      const current = ratingsMap.get(review.venue_id)!;
      current.total += review.rating;
      current.count += 1;
    });

    const venuesWithData = venues.map(venue => {
      const photos = photosMap.get(venue.id) || [];
      const offer = offersMap.get(venue.id);
      const rating = ratingsMap.get(venue.id);

      return {
        ...venue,
        venue_photos: photos,
        active_offer: offer || null,
        calculated_rating: rating ? rating.total / rating.count : 0,
        review_count: rating ? rating.count : 0,
      };
    });

    console.log('[fetchInitialVenues] Successfully processed', venuesWithData.length, 'venues');

    return {
      venues: venuesWithData,
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('[fetchInitialVenues] Error:', error);
    throw error; // Re-throw to let UI handle it
  }
}

/**
 * Fetch initial offers for offers page with filters
 */
export async function fetchInitialOffers(
  limit: number = 12,
  sportType?: string,
  searchQuery?: string,
  province?: string,
  city?: string,
  area?: string,
  discountSort?: string
) {
  try {
    console.log('[fetchInitialOffers] Starting with params:', {
      limit, sportType, searchQuery, province, city, area, discountSort
    });
    
    let query = supabase
      .from('special_offers')
      .select(`
        *,
        venues!inner(
          id, owner_id, name, slug, sport_type, city, province, area, sub_area,
          address, description, amenities, price_per_hour, opening_time, closing_time,
          is_24_7, whatsapp_number, google_maps_url, featured, status,
          rating, total_bookings, logo_url, tagline, facebook_url,
          instagram_url, created_at, updated_at
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .eq('venues.status', 'approved');
    
    // Apply sport filter
    if (sportType && sportType !== 'all') {
      console.log('[fetchInitialOffers] Applying sport filter:', sportType);
      query = query.eq('venues.sport_type', sportType);
    }
    
    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      console.log('[fetchInitialOffers] Applying search filter:', searchQuery);
      query = query.or(`offer_name.ilike.%${searchQuery}%,venues.name.ilike.%${searchQuery}%,venues.city.ilike.%${searchQuery}%`);
    }
    
    // Apply location filters
    if (province && province.trim()) {
      console.log('[fetchInitialOffers] Applying province filter:', province);
      query = query.eq('venues.province', province);
    }
    
    if (city && city.trim()) {
      console.log('[fetchInitialOffers] Applying city filter:', city);
      query = query.eq('venues.city', city);
    }
    
    if (area && area.trim()) {
      console.log('[fetchInitialOffers] Applying area filter:', area);
      query = query.eq('venues.area', area);
    }
    
    // Apply discount sorting
    if (discountSort === 'high-to-low') {
      query = query.order('discount_percentage', { ascending: false });
    } else if (discountSort === 'low-to-high') {
      query = query.order('discount_percentage', { ascending: true });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    
    const { data: offers, error, count } = await query.range(0, limit - 1);

    console.log('[fetchInitialOffers] Query result:', {
      offersCount: offers?.length || 0,
      totalCount: count,
      hasError: !!error,
      errorMessage: error?.message
    });
    
    if (offers && offers.length > 0) {
      console.log('[fetchInitialOffers] Sample offer:', {
        name: offers[0].offer_name,
        venue: offers[0].venues?.name,
        sport: offers[0].venues?.sport_type,
        city: offers[0].venues?.city,
        province: offers[0].venues?.province,
        area: offers[0].venues?.area
      });
    }

    if (error || !offers) {
      console.error('[fetchInitialOffers] Error:', error);
      return { offers: [], totalCount: 0 };
    }

    const venueIds = offers.map((o: any) => o.venues.id);
    if (venueIds.length === 0) {
      return { offers: offers || [], totalCount: count || 0 };
    }

    const [photosResult, reviewsResult] = await Promise.all([
      supabase
        .from('venue_photos')
        .select('*')
        .in('venue_id', venueIds)
        .order('display_order', { ascending: true }),
      supabase
        .from('venue_reviews')
        .select('venue_id, rating')
        .in('venue_id', venueIds)
    ]);

    const photosMap = new Map<string, VenuePhoto[]>();
    (photosResult.data || []).forEach(photo => {
      if (!photosMap.has(photo.venue_id)) {
        photosMap.set(photo.venue_id, []);
      }
      photosMap.get(photo.venue_id)!.push(photo);
    });

    const ratingsMap = new Map<string, { total: number; count: number }>();
    (reviewsResult.data || []).forEach(review => {
      if (!ratingsMap.has(review.venue_id)) {
        ratingsMap.set(review.venue_id, { total: 0, count: 0 });
      }
      const current = ratingsMap.get(review.venue_id)!;
      current.total += review.rating;
      current.count += 1;
    });

    const offersWithData = offers.map((offer: any) => {
      const photos = photosMap.get(offer.venues.id) || [];
      const rating = ratingsMap.get(offer.venues.id);

      return {
        ...offer,
        venues: {
          ...offer.venues,
          venue_photos: photos,
          calculated_rating: rating ? rating.total / rating.count : 0,
          review_count: rating ? rating.count : 0,
        },
      };
    });

    return {
      offers: offersWithData,
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('Error fetching initial offers:', error);
    return { offers: [], totalCount: 0 };
  }
}

// ==================== STATISTICS FETCHING ====================

/**
 * Fetch app statistics for landing page
 */
export async function fetchAppStats() {
  try {
    const [venuesResult, citiesResult] = await Promise.all([
      supabase
        .from('venues')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabase
        .from('venues')
        .select('city')
        .eq('status', 'approved')
    ]);

    const uniqueCities = new Set(citiesResult.data?.map(v => v.city).filter(Boolean) || []);

    return {
      totalVenues: venuesResult.count || 0,
      totalBookings: 10000,
      totalUsers: "50K",
      totalCities: uniqueCities.size,
    };
  } catch (error) {
    console.error('Error fetching app stats:', error);
    return {
      totalVenues: 0,
      totalBookings: 0,
      totalUsers: 0,
      totalCities: 0,
    };
  }
}

// ==================== TESTIMONIALS FETCHING ====================

/**
 * Fetch testimonials for landing page
 */
export async function fetchTestimonials() {
  try {
    const { data, error } = await supabase
      .from('venue_reviews')
      .select('*, venues!inner(name)')
      .gte('rating', 4)
      .order('date', { ascending: false })
      .limit(6);

    if (error) return [];
    return data || [];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

// ==================== SPORTS CATEGORIES FETCHING ====================

export interface SportCount {
  name: string;
  sport_type: string;
  count: number;
}

/**
 * Fetch top sports by venue count
 */
export async function fetchTopSports(limit: number = 6): Promise<SportCount[]> {
  try {
    const { data, error } = await supabase
      .from('venues')
      .select('sport_type')
      .eq('status', 'approved');
    
    if (error || !data) return [];

    // Count venues by sport type
    const counts: Record<string, number> = {};
    data.forEach((venue) => {
      counts[venue.sport_type] = (counts[venue.sport_type] || 0) + 1;
    });

    // Convert to array and sort by count (descending)
    const sortedSports = Object.entries(counts)
      .filter(([sport]) => sport !== 'football') // Exclude football since futsal is already shown
      .map(([sport, count]) => ({
        name: sport.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        sport_type: sport,
        count: count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return sortedSports;
  } catch (error) {
    console.error('Error fetching top sports:', error);
    return [];
  }
}

// ==================== OWNER DASHBOARD FETCHING ====================

export interface OwnerDashboardData {
  venues: Array<Venue & { venue_photos: VenuePhoto[] }>;
  stats: {
    totalVenues: number;
    approvedVenues: number;
    pendingVenues: number;
    totalBookings: number;
  };
}

/**
 * Fetch owner dashboard data (venues + stats)
 */
export async function fetchOwnerDashboard(userId: string): Promise<OwnerDashboardData> {
  try {
    // Fetch venues with photos
    const { data: venues, error: venuesError } = await supabase
      .from('venues')
      .select('*, venue_photos(*)')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (venuesError) {
      console.error('Error fetching owner venues:', venuesError);
      return {
        venues: [],
        stats: { totalVenues: 0, approvedVenues: 0, pendingVenues: 0, totalBookings: 0 }
      };
    }

    const venueData = venues || [];

    // Calculate stats
    const approved = venueData.filter(v => v.status === 'approved').length;
    const pending = venueData.filter(v => v.status === 'pending').length;
    const totalBookings = venueData.reduce((sum, v) => sum + (v.total_bookings || 0), 0);

    return {
      venues: venueData,
      stats: {
        totalVenues: venueData.length,
        approvedVenues: approved,
        pendingVenues: pending,
        totalBookings,
      }
    };
  } catch (error) {
    console.error('Error fetching owner dashboard:', error);
    return {
      venues: [],
      stats: { totalVenues: 0, approvedVenues: 0, pendingVenues: 0, totalBookings: 0 }
    };
  }
}

/**
 * Fetch a specific venue for editing (includes photos and pricing rules)
 */
export async function fetchVenueForEdit(venueId: string, userId: string) {
  try {
    const { data: venueData, error } = await supabase
      .from('venues')
      .select('*, venue_photos(*), venue_pricing_rules(*)')
      .eq('id', venueId)
      .eq('owner_id', userId)
      .single();

    if (error || !venueData) {
      return null;
    }

    return venueData;
  } catch (error) {
    console.error('Error fetching venue for edit:', error);
    return null;
  }
}

/**
 * Fetch owner bookings
 */
export async function fetchOwnerBookings(userId: string) {
  try {
    // Get owner's venues first
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', userId);

    if (!venues || venues.length === 0) {
      return [];
    }

    const venueIds = venues.map(v => v.id);

    // Fetch bookings for those venues
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*, venues(name, city, sport_type)')
      .in('venue_id', venueIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owner bookings:', error);
      return [];
    }

    return bookings || [];
  } catch (error) {
    console.error('Error fetching owner bookings:', error);
    return [];
  }
}

/**
 * Fetch owner analytics data
 */
export async function fetchOwnerAnalytics(userId: string) {
  try {
    // Get owner's venues
    const { data: venues } = await supabase
      .from('venues')
      .select('id, name, city, sport_type, total_bookings, created_at')
      .eq('owner_id', userId);

    if (!venues || venues.length === 0) {
      return {
        venues: [],
        totalBookings: 0,
        totalRevenue: 0,
        recentBookings: []
      };
    }

    const venueIds = venues.map(v => v.id);

    // Fetch bookings for analytics (recent ones)
    const { data: recentBookings } = await supabase
      .from('bookings')
      .select('*, venues(name)')
      .in('venue_id', venueIds)
      .order('created_at', { ascending: false })
      .limit(10);

    const hasUpdates = await autoUpdateBookingStatuses(recentBookings || []);
    let finalBookings = recentBookings;
    if (hasUpdates) {
      const { data: updatedBookings } = await supabase
        .from('bookings')
        .select('*, venues(name)')
        .in('venue_id', venueIds)
        .order('created_at', { ascending: false })
        .limit(10);
      finalBookings = updatedBookings;
    }

    // Fetch all bookings to calculate total revenue and total bookings accurately
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('id, venue_id, total_price, status, booking_date, start_time, end_time')
      .in('venue_id', venueIds);

    // Also run auto-update on all bookings to ensure accurate revenue
    if (allBookings) {
      await autoUpdateBookingStatuses(allBookings);
    }

    // Re-fetch if needed, or just calculate based on current time
    // Actually, to save a network call, we can just calculate revenue 
    // considering expired confirmed as completed and ignoring expired pending.
    let totalRevenue = 0;
    let actualTotalBookings = 0;

    // Calculate per-venue stats
    const venueStats: Record<string, { bookings: number, revenue: number }> = {};
    venueIds.forEach(id => {
      venueStats[id] = { bookings: 0, revenue: 0 };
    });

    if (allBookings) {
      const now = new Date();
      
      allBookings.forEach(booking => {
        const vId = booking.venue_id;
        if (!venueStats[vId]) return;

        let effectiveStatus = booking.status;
        
        // Determine effective status
        if (booking.status === 'pending') {
          try {
            if (new Date(`${booking.booking_date}T${booking.start_time}`) < now) {
              effectiveStatus = 'expired'; // Will be deleted, so ignore
            }
          } catch (e) {}
        } else if (booking.status === 'confirmed') {
          try {
            if (new Date(`${booking.booking_date}T${booking.end_time}`) < now) {
              effectiveStatus = 'completed';
            }
          } catch (e) {}
        }

        if (effectiveStatus !== 'expired' && effectiveStatus !== 'cancelled') {
          venueStats[vId].bookings += 1;
          actualTotalBookings += 1;
          
          // Only add to revenue if the booking is confirmed or completed
          if (effectiveStatus === 'confirmed' || effectiveStatus === 'completed') {
            const amount = booking.total_price || 0;
            venueStats[vId].revenue += amount;
            totalRevenue += amount;
          }
        }
      });
    } else {
      // Fallback if allBookings fails
      actualTotalBookings = venues.reduce((sum, v) => sum + (v.total_bookings || 0), 0);
    }

    // Attach stats to venues
    const enrichedVenues = venues.map(v => ({
      ...v,
      actual_bookings: venueStats[v.id]?.bookings || v.total_bookings || 0,
      revenue: venueStats[v.id]?.revenue || 0
    }));

    // Ensure recent bookings also have the correct venue name mapped
    const enrichedRecentBookings = (finalBookings || []).map(b => ({
      ...b,
      venue_name: b.venues?.name || 'Venue Booking'
    }));

    return {
      venues: enrichedVenues,
      totalBookings: actualTotalBookings,
      totalRevenue,
      recentBookings: enrichedRecentBookings
    };
  } catch (error) {
    console.error('Error fetching owner analytics:', error);
    return {
      venues: [],
      totalBookings: 0,
      totalRevenue: 0,
      recentBookings: []
    };
  }
}

// ==================== BOOKING ACTIONS ====================

/**
 * Auto-update booking statuses:
 * - Mark expired confirmed bookings as completed
 * - Delete expired pending bookings
 */
export async function autoUpdateBookingStatuses(bookings: any[]) {
  if (!bookings || bookings.length === 0) return false;
  
  const now = new Date();
  let hasUpdates = false;
  
  const expiredPending = bookings.filter(b => {
    if (b.status !== 'pending') return false;
    try {
      return new Date(`${b.booking_date}T${b.start_time}`) < now;
    } catch { return false; }
  });
  
  const expiredConfirmed = bookings.filter(b => {
    if (b.status !== 'confirmed') return false;
    try {
      return new Date(`${b.booking_date}T${b.end_time}`) < now;
    } catch { return false; }
  });
  
  for (const b of expiredPending) {
    try {
      await supabase.from('bookings').delete().eq('id', b.id);
      hasUpdates = true;
    } catch (e) { console.error('Error auto-deleting pending booking:', e); }
  }
  
  for (const b of expiredConfirmed) {
    try {
      await supabase.from('bookings').update({ status: 'completed' }).eq('id', b.id);
      hasUpdates = true;
    } catch (e) { console.error('Error auto-completing confirmed booking:', e); }
  }
  
  return hasUpdates;
}

export interface CreateBookingData {
  venue_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  player_name: string;
  player_phone: string;
  player_email: string;
  notes?: string;
  total_price: number;
}

/**
 * Create a new booking
 */
export async function createBooking(bookingData: CreateBookingData) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...bookingData,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return { data: null, error: error.message || 'Failed to create booking' };
  }
}

// ==================== PROFILE ACTIONS ====================

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  whatsapp_number?: string;
  role?: 'player' | 'venue_owner';
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, profileData: UpdateProfileData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { data: null, error: error.message || 'Failed to update profile' };
  }
}

/**
 * Fetch user profile
 */
export async function fetchUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to handle missing profiles gracefully

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    return { data: null, error: error.message || 'Failed to fetch profile' };
  }
}

// ==================== CONTACT ACTIONS ====================

export interface ContactSubmissionData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/**
 * Submit contact form
 */
export async function submitContactForm(formData: ContactSubmissionData) {
  try {
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        ...formData,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error submitting contact form:', error);
    return { data: null, error: error.message || 'Failed to submit contact form' };
  }
}

// ==================== REVIEW ACTIONS ====================

export interface SubmitReviewData {
  venue_id: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  review_text: string;
  photo_urls?: string[];
}

/**
 * Submit a venue review
 */
export async function submitReview(reviewData: SubmitReviewData) {
  try {
    const { data, error } = await supabase
      .from('venue_reviews')
      .insert({
        ...reviewData,
        date: new Date().toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return { data: null, error: error.message || 'Failed to submit review' };
  }
}

/**
 * Fetch reviews for a venue
 */
export async function fetchVenueReviews(venueId: string) {
  try {
    const { data, error } = await supabase
      .from('venue_reviews')
      .select('*')
      .eq('venue_id', venueId)
      .eq('status', 'approved')
      .order('date', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return { data: [], error: error.message || 'Failed to fetch reviews' };
  }
}

// ==================== OWNER: BOOKINGS MANAGEMENT ====================

/**
 * Confirm a pending booking (Owner action)
 */
export async function confirmBooking(bookingId: string) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error confirming booking:', error);
    return { data: null, error: error.message || 'Failed to confirm booking' };
  }
}

/**
 * Delete a booking (Owner action)
 */
export async function deleteBooking(bookingId: string) {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    return { error: error.message || 'Failed to delete booking' };
  }
}

// ==================== OWNER: VENUES MANAGEMENT ====================

export interface UpdateVenueData {
  name?: string;
  sport_type?: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel';
  province?: string;
  city?: string;
  area?: string;
  sub_area?: string;
  address?: string;
  description?: string;
  amenities?: string[];
  price_per_hour?: number;
  opening_time?: string;
  closing_time?: string;
  is_24_7?: boolean;
  whatsapp_number?: string;
  logo_url?: string;
  tagline?: string;
  facebook_url?: string;
  instagram_url?: string;
  google_maps_url?: string;
}

/**
 * Update a venue (Owner action)
 */
export async function updateVenue(venueId: string, venueData: UpdateVenueData) {
  try {
    const { data, error } = await supabase
      .from('venues')
      .update(venueData)
      .eq('id', venueId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating venue:', error);
    return { data: null, error: error.message || 'Failed to update venue' };
  }
}

/**
 * Delete a venue (Owner action)
 */
export async function deleteVenue(venueId: string) {
  try {
    const { error } = await supabase
      .from('venues')
      .delete()
      .eq('id', venueId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting venue:', error);
    return { error: error.message || 'Failed to delete venue' };
  }
}

/**
 * Fetch all reviews for a venue (Owner can see all, not just approved)
 */
export async function fetchAllVenueReviews(venueId: string) {
  try {
    const { data, error } = await supabase
      .from('venue_reviews')
      .select('*')
      .eq('venue_id', venueId)
      .order('date', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching all venue reviews:', error);
    return { data: [], error: error.message || 'Failed to fetch reviews' };
  }
}

/**
 * Report a review (Owner action)
 * Note: review_reports table may not be in current schema - simplified implementation
 */
export async function reportReview(reviewId: string, venueId: string, reporterId: string, reason: string) {
  try {
    // TODO: Implement when review_reports table is added to schema
    console.log('Report review:', { reviewId, venueId, reporterId, reason });
    return { data: null, error: 'Review reporting not yet implemented' };
  } catch (error: any) {
    console.error('Error reporting review:', error);
    return { data: null, error: error.message || 'Failed to report review' };
  }
}

/**
 * Fetch report statuses for reviews (Owner action)
 * Note: review_reports table may not be in current schema - simplified implementation
 */
export async function fetchReviewReportStatuses(venueId: string, reporterId: string) {
  try {
    // TODO: Implement when review_reports table is added to schema
    console.log('Fetch report statuses:', { venueId, reporterId });
    return { data: new Map(), error: null };
  } catch (error: any) {
    console.error('Error fetching report statuses:', error);
    return { data: new Map(), error: error.message || 'Failed to fetch report statuses' };
  }
}

// ==================== OWNER: SPECIAL OFFERS MANAGEMENT ====================

export interface CreateOfferData {
  venue_id: string;
  offer_name: string;
  description?: string;
  original_price: number;
  offer_price: number;
  valid_from: string; // ISO date string
  valid_until: string; // ISO date string
  is_active: boolean;
}

export interface UpdateOfferData {
  offer_name?: string;
  description?: string;
  original_price?: number;
  offer_price?: number;
  valid_from?: string;
  valid_until?: string;
  is_active?: boolean;
}

/**
 * Fetch all special offers for owner's venues
 */
export async function fetchOwnerOffers(userId: string) {
  try {
    // First get owner's venues
    const { data: venues } = await supabase
      .from('venues')
      .select('id')
      .eq('owner_id', userId);

    if (!venues || venues.length === 0) {
      return { data: [], error: null };
    }

    const venueIds = venues.map(v => v.id);

    // Then fetch offers for those venues
    const { data, error } = await supabase
      .from('special_offers')
      .select('*, venues(name, city, sport_type)')
      .in('venue_id', venueIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error: any) {
    console.error('Error fetching owner offers:', error);
    return { data: [], error: error.message || 'Failed to fetch offers' };
  }
}

/**
 * Create a new special offer (Owner action)
 */
export async function createSpecialOffer(offerData: CreateOfferData) {
  try {
    const { data, error } = await supabase
      .from('special_offers')
      .insert(offerData)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating special offer:', error);
    return { data: null, error: error.message || 'Failed to create offer' };
  }
}

/**
 * Update a special offer (Owner action)
 */
export async function updateSpecialOffer(offerId: string, offerData: UpdateOfferData) {
  try {
    const { data, error } = await supabase
      .from('special_offers')
      .update(offerData)
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating special offer:', error);
    return { data: null, error: error.message || 'Failed to update offer' };
  }
}

/**
 * Delete a special offer (Owner action)
 */
export async function deleteSpecialOffer(offerId: string) {
  try {
    const { error } = await supabase
      .from('special_offers')
      .delete()
      .eq('id', offerId);

    if (error) throw error;

    return { error: null };
  } catch (error: any) {
    console.error('Error deleting special offer:', error);
    return { error: error.message || 'Failed to delete offer' };
  }
}

/**
 * Toggle offer active status (Owner action)
 */
export async function toggleOfferStatus(offerId: string, isActive: boolean) {
  try {
    const { data, error } = await supabase
      .from('special_offers')
      .update({ is_active: isActive })
      .eq('id', offerId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error toggling offer status:', error);
    return { data: null, error: error.message || 'Failed to toggle offer status' };
  }
}

// ==================== OWNER: CREATE VENUE ====================

export interface CreateVenueData {
  owner_id: string;
  name: string;
  slug: string;
  sport_type: 'cricket' | 'football' | 'futsal' | 'pickleball' | 'badminton' | 'padel';
  province: string;
  city: string;
  area?: string;
  sub_area?: string;
  address: string;
  description?: string;
  amenities?: string[];
  price_per_hour: number;
  opening_time?: string;
  closing_time?: string;
  is_24_7: boolean;
  whatsapp_number: string;
  logo_url?: string;
  tagline?: string;
  facebook_url?: string;
  instagram_url?: string;
  google_maps_url?: string;
}

export interface VenuePhotoData {
  photo_url: string;
  display_order: number;
}

export interface PricingRuleData {
  day_of_week: string;
  start_time: string;
  end_time: string;
  price_per_hour: number;
}

/**
 * Upload venue photo to storage
 */
export async function uploadVenuePhoto(userId: string, venueId: string, photoBlob: Blob, index: number) {
  try {
    const fileExt = 'jpg';
    const fileName = `${userId}/${venueId}/photo_${index}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('venue-photos')
      .upload(fileName, photoBlob);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(fileName);

    return { data: publicUrl, error: null };
  } catch (error: any) {
    console.error('Error uploading venue photo:', error);
    return { data: null, error: error.message || 'Failed to upload photo' };
  }
}

/**
 * Create a new venue with photos and pricing rules (Owner action)
 */
export async function createVenue(
  venueData: CreateVenueData,
  photos: VenuePhotoData[],
  pricingRules: PricingRuleData[]
) {
  try {
    // Insert venue
    const { data: venue, error: venueError } = await supabase
      .from('venues')
      .insert({
        ...venueData,
        status: 'pending',
      })
      .select()
      .single();

    if (venueError) throw venueError;

    // Insert photos if any
    if (photos.length > 0) {
      const photoInserts = photos.map((photo, index) => ({
        venue_id: venue.id,
        photo_url: photo.photo_url,
        is_primary: index === 0, // First photo is primary
        display_order: photo.display_order,
      }));

      const { error: photoError } = await supabase
        .from('venue_photos')
        .insert(photoInserts);

      if (photoError) throw photoError;
    }

    // Insert pricing rules if any
    if (pricingRules.length > 0) {
      const ruleInserts = pricingRules.map(rule => ({
        venue_id: venue.id,
        ...rule,
      }));

      const { error: ruleError } = await supabase
        .from('venue_pricing_rules')
        .insert(ruleInserts);

      if (ruleError) throw ruleError;
    }

    return { data: venue, error: null };
  } catch (error: any) {
    console.error('Error creating venue:', error);
    return { data: null, error: error.message || 'Failed to create venue' };
  }
}

// ==================== LOYALTY SYSTEM ====================

export interface LoyaltyTier {
  id?: string;
  venue_id: string;
  tier_name: string;
  min_bookings: number;
  discount_percent: number;
}

/**
 * Fetch loyalty tiers for a venue
 */
export async function fetchVenueLoyaltyTiers(venueId: string): Promise<LoyaltyTier[]> {
  try {
    const { data, error } = await supabase
      .from('venue_loyalty_tiers')
      .select('*')
      .eq('venue_id', venueId)
      .order('min_bookings', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    return [];
  }
}

/**
 * Get user's completed booking count at a specific venue
 * and determine their applicable loyalty tier + discount
 */
export async function fetchUserLoyaltyStatus(
  venueId: string,
  playerEmail: string
): Promise<{ completedBookings: number; currentTier: LoyaltyTier | null; nextTier: LoyaltyTier | null }> {
  try {
    // Fetch confirmed + completed bookings for this user at this venue
    const { data: bookingsData, error: countError } = await supabase
      .from('bookings')
      .select('status, booking_date, end_time')
      .eq('venue_id', venueId)
      .eq('player_email', playerEmail)
      .in('status', ['completed', 'confirmed']);

    if (countError) throw countError;

    // Count bookings that are effectively completed:
    // - status is 'completed' in DB, OR
    // - status is 'confirmed' AND end time has passed (same as getEffectiveStatus logic)
    const now = new Date();
    const completedBookings = (bookingsData || []).filter((b) => {
      if (b.status === 'completed') return true;
      if (b.status === 'confirmed') {
        try {
          const bookingEndDateTime = new Date(`${b.booking_date}T${b.end_time}`);
          return bookingEndDateTime < now;
        } catch {
          return false;
        }
      }
      return false;
    }).length;

    // Fetch loyalty tiers for this venue
    const tiers = await fetchVenueLoyaltyTiers(venueId);

    if (tiers.length === 0) {
      return { completedBookings, currentTier: null, nextTier: null };
    }

    // Find the highest applicable tier (where user's bookings >= min_bookings)
    let currentTier: LoyaltyTier | null = null;
    let nextTier: LoyaltyTier | null = null;

    for (const tier of tiers) {
      if (completedBookings >= tier.min_bookings) {
        currentTier = tier;
      } else if (!nextTier) {
        nextTier = tier;
      }
    }

    return { completedBookings, currentTier, nextTier };
  } catch (error) {
    console.error('Error fetching user loyalty status:', error);
    return { completedBookings: 0, currentTier: null, nextTier: null };
  }
}

/**
 * Save loyalty tiers for a venue (owner action)
 * Deletes existing tiers and inserts new ones
 */
export async function saveVenueLoyaltyTiers(
  venueId: string,
  tiers: Array<{ tier_name: string; min_bookings: number; discount_percent: number }>
) {
  try {
    // Delete existing tiers for this venue
    const { error: deleteError } = await supabase
      .from('venue_loyalty_tiers')
      .delete()
      .eq('venue_id', venueId);

    if (deleteError) throw deleteError;

    // Insert new tiers (if any)
    if (tiers.length > 0) {
      const tierInserts = tiers.map(tier => ({
        venue_id: venueId,
        tier_name: tier.tier_name,
        min_bookings: tier.min_bookings,
        discount_percent: tier.discount_percent,
      }));

      const { error: insertError } = await supabase
        .from('venue_loyalty_tiers')
        .insert(tierInserts);

      if (insertError) throw insertError;
    }

    return { error: null };
  } catch (error: any) {
    console.error('Error saving loyalty tiers:', error);
    return { error: error.message || 'Failed to save loyalty tiers' };
  }
}
