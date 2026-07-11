'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Mail, MapPin, Phone, User } from 'lucide-react';
import { formatText } from '@/lib/format';

interface ContactInfoCardProps {
  name: string;
  email?: string | null;
  contactNumber?: string | null;
  address?: string | null;
}

export function ContactInfoCard({
  name,
  email,
  contactNumber,
  address,
}: ContactInfoCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="text-xs">Full Name</span>
            </div>
            <p className="font-medium">{formatText(name)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="text-xs">Email Address</span>
            </div>
            <p className="font-medium">{email ? formatText(email) : '-'}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span className="text-xs">Contact Number</span>
            </div>
            <p className="font-medium">
              {contactNumber ? formatText(contactNumber) : '-'}
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="text-xs">Address</span>
            </div>
            <p className="font-medium">
              {address ? formatText(address) : '-'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
