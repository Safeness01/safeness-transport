import Stripe from "stripe";
import { Request, Response } from "express";

const getStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is missing from environment variables");
  }
  return new Stripe(key, {
    apiVersion: "2025-01-27.acacia" as any,
  });
};

const vehicles: Record<string, { name: string; startFee: number; kmPrice: number; hourlyPrice: number }> = {
  eco: { name: "Économique", startFee: 30, kmPrice: 1.80, hourlyPrice: 40 },
  tesla: { name: "Tesla / BYD", startFee: 40, kmPrice: 1.90, hourlyPrice: 50 },
  business: { name: "Mercedes Classe E", startFee: 50, kmPrice: 2.10, hourlyPrice: 60 },
  van_v: { name: "Mercedes Classe V", startFee: 55, kmPrice: 2.50, hourlyPrice: 90 },
  first: { name: "Mercedes Classe S", startFee: 70, kmPrice: 3.00, hourlyPrice: 120 },
  // legacy fallback keys
  confort: { name: "Confort Class", startFee: 40, kmPrice: 1.90, hourlyPrice: 50 },
  van: { name: "Business Van", startFee: 55, kmPrice: 2.50, hourlyPrice: 90 },
};

const extrasList = {
  child_seat: { price: 5 },
  booster_seat: { price: 0 },
  extra_luggage: { price: 10 },
  greeter: { price: 30 },
};

interface CheckoutRequestBody {
  serviceType: 'transfer' | 'hourly';
  durationHours: number;
  vehicle: string;
  distance: number;
  extras: string[];
  date?: string;
  time: string;
  isReturnTrip: boolean;
  returnDate?: string;
  returnTime?: string;
  pickup: string;
  dropoff: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  passengers: number;
  luggage: number;
  flightNumber: string;
  lang?: string;
  serviceCategory?: string;
}

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      serviceType, durationHours, vehicle, distance, extras, date, time, isReturnTrip, returnDate, returnTime, pickup, dropoff,
      firstName, lastName, email, phone, passengers, luggage, flightNumber,
      lang = 'fr',
      serviceCategory
    } = req.body as CheckoutRequestBody;

    if (!vehicle || !(vehicles as any)[vehicle]) {
      return res.status(400).json({ error: "Valid vehicle type is required" });
    }

    // Calculation logic (matching App.tsx)
    const selectedVehicle = vehicles[vehicle] || vehicles.eco;
    
    let baseTripPrice = 0;
    
    if (serviceType === 'hourly') {
      baseTripPrice = selectedVehicle.hourlyPrice * (durationHours || 2);
    } else {
      // Formule de base: Forfait Départ + (Distance km * Prix/km)
      baseTripPrice = selectedVehicle.startFee + ((distance || 0) * selectedVehicle.kmPrice);
    }

    // Majoration de Nuit (22h00 - 06h00) : +20% sur le trajet
    if (time) {
      const match = time.match(/^(\d{1,2}):/);
      if (match) {
        const hour = parseInt(match[1], 10);
        if (hour >= 22 || hour < 6) {
          baseTripPrice *= 1.20;
        }
      }
    }

    // Option Aller-Retour : Calcul de l'aller + retour avec -10% de remise globale
    if (serviceType === 'transfer' && isReturnTrip) {
      baseTripPrice = (baseTripPrice * 2) * 0.90;
    }

    // Extras
    let extrasPrice = 0;
    if (Array.isArray(extras)) {
      if (extras.includes('child_seat')) extrasPrice += 5;
      if (extras.includes('booster_seat')) extrasPrice += 0;
      if (extras.includes('extra_luggage') || (luggage && luggage > 3)) extrasPrice += 10;
      if (extras.includes('greeter')) extrasPrice += 30;
    } else if (luggage && luggage > 3) {
      extrasPrice += 10;
    }

    const calculatedPrice = baseTripPrice + extrasPrice;
    const finalAmount = Math.round(calculatedPrice);

    const stripe = getStripe();

    const isEn = lang === 'en';
    const serviceName = serviceType === 'hourly' 
      ? (isEn ? 'Hourly Disposal' : 'Mise à disposition')
      : (isEn ? 'Transfer' : 'Transfert');
      
    const productName = `${serviceName} ${selectedVehicle.name}`;
    const productDesc = serviceType === 'hourly'
      ? (isEn ? `For ${durationHours} hours from ${pickup}` : `Pendant ${durationHours} heures depuis ${pickup}`)
      : (isEn 
          ? `From ${pickup} to ${dropoff}${time ? ` - ${time}` : ""}`
          : `De ${pickup} à ${dropoff}${time ? ` - ${time}` : ""}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: finalAmount * 100, // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      customer_email: email,
      metadata: {
        serviceType,
        serviceCategory: serviceCategory || "Default",
        durationHours: durationHours?.toString() || "0",
        firstName,
        lastName,
        email,
        phone,
        pickup,
        dropoff,
        date: date || "",
        time,
        vehicle: selectedVehicle.name,
        passengers: passengers.toString(),
        luggage: luggage.toString(),
        flightNumber: flightNumber || "N/A",
        extras: Array.isArray(extras) ? extras.join(", ") : "None",
        isReturnTrip: isReturnTrip.toString(),
        returnDate: returnDate || "",
        returnTime: returnTime || "",
      },
      success_url: `${process.env.APP_URL || process.env.VITE_APP_URL}/?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || process.env.VITE_APP_URL}/?status=cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return res.status(500).json({ error: "Une erreur est survenue lors de la préparation de votre paiement. Veuillez réessayer plus tard." });
  }
}
