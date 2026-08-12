import { Request, Response } from "express";
import { Resend } from "resend";

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("RESEND_API_KEY is missing from environment variables");
  }
  return new Resend(key);
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

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { 
      serviceType, durationHours, vehicle, distance, extras, time, isReturnTrip, pickup, dropoff,
      firstName, lastName, email, phone, passengers, luggage, flightNumber,
      paymentMethod = 'cash',
      lang = 'fr',
      serviceCategory
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

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
    const extrasText = Array.isArray(extras) && extras.length > 0 ? extras.join(", ") : "Aucun";
    const paymentLabel = 
      paymentMethod === 'card_on_board' 
        ? "Paiement à bord par Carte Bancaire (Terminal TPE au chauffeur)" 
        : paymentMethod === 'cash' || paymentMethod === 'cash_on_board'
        ? "Paiement à bord en Espèces" 
        : paymentMethod;

    const resend = getResend();

    // 1. Email for customer
    await resend.emails.send({
      from: "Safeness Transport <contact@safeness-transport.com>",
      to: email,
      subject: "Demande de réservation enregistrée - Safeness Transport",
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h1 style="color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px;">Votre demande de réservation</h1>
          <p>Bonjour ${firstName} ${lastName},</p>
          <p>Nous avons bien reçu votre demande de réservation. Notre équipe traitera votre demande et vous contactera rapidement pour confirmer la disponibilité.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111;">Détails de la réservation :</h3>
            <p><strong>Service :</strong> ${serviceType === 'hourly' ? 'Mise à disposition' : 'Transfert'}</p>
            <p><strong>Lieu de départ :</strong> ${pickup}</p>
            ${serviceType === 'hourly' 
              ? `<p><strong>Durée :</strong> ${durationHours} heures</p>`
              : `<p><strong>Lieu d'arrivée :</strong> ${dropoff}</p>`
            }
            <p><strong>Date & Heure :</strong> ${time || 'Non spécifié'}</p>
            <p><strong>Véhicule :</strong> ${selectedVehicle.name}</p>
            <p><strong>Passagers :</strong> ${passengers}</p>
            <p><strong>Bagages :</strong> ${luggage}</p>
            <p><strong>Options / Extras :</strong> ${extrasText}</p>
            ${serviceType === 'transfer' ? `<p><strong>Trajet retour :</strong> ${isReturnTrip ? 'Oui' : 'Non'}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
            <p><strong>Mode de paiement :</strong> ${paymentLabel}</p>
            ${finalAmount > 0 ? `<p><strong>Montant estimé :</strong> ${finalAmount} €</p>` : ''}
          </div>

          <p>Un conseiller vous contactera par SMS ou par email sous peu.</p>
          <p>Amicalement,<br /><strong>L'équipe Safeness Transport</strong></p>
        </div>
      `,
    });

    // 2. Email for admin notification
    await resend.emails.send({
      from: "Safeness Transport <contact@safeness-transport.com>",
      to: "safeness.transport@yahoo.com",
      subject: `🚨 Nouvelle réservation à bord (Cash) - ${firstName} ${lastName}`,
      html: `
        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
          <h1 style="color: #000; border-bottom: 2px solid #eee; padding-bottom: 10px;">Nouvelle demande de réservation (${paymentLabel})</h1>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #111;">Informations client :</h3>
            <p><strong>Client :</strong> ${firstName} ${lastName}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Téléphone :</strong> ${phone}</p>
            <p><strong>N° Vol / Train :</strong> ${flightNumber || 'Non renseigné'}</p>
            
            <h3 style="margin-top: 15px; color: #111;">Détails du trajet :</h3>
            <p><strong>Type :</strong> ${serviceType === 'hourly' ? 'Mise à disposition' : 'Transfert'}</p>
            <p><strong>Départ :</strong> ${pickup}</p>
            ${serviceType === 'hourly' 
              ? `<p><strong>Durée :</strong> ${durationHours} heures</p>`
              : `<p><strong>Arrivée :</strong> ${dropoff}</p>`
            }
            <p><strong>Date / Heure :</strong> ${time}</p>
            <p><strong>Véhicule :</strong> ${selectedVehicle.name}</p>
            <p><strong>Passagers :</strong> ${passengers}</p>
            <p><strong>Bagages :</strong> ${luggage}</p>
            <p><strong>Extras :</strong> ${extrasText}</p>
            ${serviceType === 'transfer' ? `<p><strong>Trajet retour :</strong> ${isReturnTrip ? 'Oui' : 'Non'}</p>` : ''}
            <hr style="border: none; border-top: 1px solid #ddd; margin: 15px 0;" />
            <p><strong>Mode de paiement :</strong> ${paymentLabel}</p>
            <p><strong>Montant estimé :</strong> ${finalAmount} €</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Cash booking error:", error);
    return res.status(500).json({ error: error.message || "Failed to process booking email" });
  }
}
