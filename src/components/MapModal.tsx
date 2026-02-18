import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Map, Eye, ExternalLink, Loader2 } from "lucide-react";

const GOOGLE_MAPS_API_KEY = "AIzaSyBPjxOb81YiJIlcMBdpGcG1R1-UVyzHolA";

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueName: string;
  address: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export function MapModal({
  isOpen,
  onClose,
  venueName,
  address,
}: MapModalProps) {
  const [viewMode, setViewMode] = useState<"map" | "streetview">("map");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Geocode address to get coordinates when modal opens
  useEffect(() => {
    if (isOpen && address && !coordinates) {
      setIsLoading(true);
      setGeocodingError(null);

      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

      fetch(geocodeUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "OK" && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            setCoordinates({ lat: location.lat, lng: location.lng });
          } else {
            setGeocodingError(
              "Não foi possível encontrar as coordenadas para este endereço.",
            );
          }
        })
        .catch(() => {
          setGeocodingError("Erro ao buscar coordenadas.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, address, coordinates]);

  // Reset coordinates when address changes
  useEffect(() => {
    setCoordinates(null);
    setGeocodingError(null);
  }, [address]);

  // Encode the address for URL
  const encodedAddress = encodeURIComponent(address);

  // Google Maps Embed API URLs
  const mapEmbedUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedAddress}&zoom=17`;

  // Street View requires coordinates
  const streetViewEmbedUrl = coordinates
    ? `https://www.google.com/maps/embed/v1/streetview?key=${GOOGLE_MAPS_API_KEY}&location=${coordinates.lat},${coordinates.lng}&heading=0&pitch=0&fov=90`
    : null;

  // Fallback URL without API key
  const fallbackMapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=17&ie=UTF8&iwloc=&output=embed`;

  // Direct Google Maps link for opening in new tab
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass border-hacktown-cyan/30">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Map className="h-5 w-5 text-hacktown-cyan" />
            {venueName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {address}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={viewMode === "map" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("map")}
              className={
                viewMode === "map"
                  ? "bg-hacktown-cyan hover:bg-hacktown-cyan/80"
                  : "border-hacktown-cyan/30 hover:bg-hacktown-cyan/20"
              }
            >
              <Map className="h-4 w-4 mr-2" />
              Mapa
            </Button>
            <Button
              variant={viewMode === "streetview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("streetview")}
              className={
                viewMode === "streetview"
                  ? "bg-hacktown-pink hover:bg-hacktown-pink/80"
                  : "border-hacktown-pink/30 hover:bg-hacktown-pink/20"
              }
            >
              <Eye className="h-4 w-4 mr-2" />
              Street View 360°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(googleMapsLink, "_blank")}
              className="ml-auto border-hacktown-cyan/30 hover:bg-hacktown-cyan/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir no Google Maps
            </Button>
          </div>

          {/* Map/Street View Container */}
          <div className="relative w-full h-[500px] rounded-lg overflow-hidden border border-border/50">
            {viewMode === "map" ? (
              <iframe
                src={mapEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${venueName}`}
                onError={(e) => {
                  // Fallback to non-API URL if embed fails
                  const iframe = e.target as HTMLIFrameElement;
                  iframe.src = fallbackMapUrl;
                }}
              />
            ) : isLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-background/50">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-hacktown-pink mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Carregando Street View...
                  </p>
                </div>
              </div>
            ) : geocodingError ? (
              <div className="w-full h-full flex items-center justify-center bg-background/50">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {geocodingError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => window.open(googleMapsLink, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir no Google Maps
                  </Button>
                </div>
              </div>
            ) : streetViewEmbedUrl ? (
              <iframe
                src={streetViewEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Street View de ${venueName}`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-background/50">
                <p className="text-sm text-muted-foreground">
                  Street View não disponível
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
