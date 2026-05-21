"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight } from "lucide-react";

export interface TrialConfigData {
  creditAmount: number;
  creditDisplay: string;
  duration: string;
  endpointUrl: string;
  protocol: "x402" | "MPP";
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
}

interface StepTrialConfigProps {
  data: TrialConfigData;
  onChange: (data: TrialConfigData) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepTrialConfig({ data, onChange, onNext, onBack }: StepTrialConfigProps) {
  const isValid =
    data.creditAmount > 0 &&
    data.endpointUrl.trim().length > 0 &&
    data.path.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Trial Configuration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the free trial credits and endpoint details.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="credit-amount">Credit Amount (USD)</Label>
            <Input
              id="credit-amount"
              type="number"
              min={1}
              placeholder="1000"
              value={data.creditAmount || ""}
              onChange={(e) =>
                onChange({ ...data, creditAmount: parseInt(e.target.value, 10) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={data.duration}
              onValueChange={(val) => onChange({ ...data, duration: val })}
            >
              <SelectTrigger id="duration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 days">7 days</SelectItem>
                <SelectItem value="14 days">14 days</SelectItem>
                <SelectItem value="30 days">30 days</SelectItem>
                <SelectItem value="60 days">60 days</SelectItem>
                <SelectItem value="90 days">90 days</SelectItem>
                <SelectItem value="3 months">3 months</SelectItem>
                <SelectItem value="6 months">6 months</SelectItem>
                <SelectItem value="12 months">12 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="credit-display">Credit Display Text</Label>
          <Input
            id="credit-display"
            placeholder='e.g., "$2,000 in API credits" or "100K free requests"'
            value={data.creditDisplay}
            onChange={(e) => onChange({ ...data, creditDisplay: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">How credits appear on the deal card. Leave empty to auto-generate.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="endpoint-url">Endpoint Base URL</Label>
          <Input
            id="endpoint-url"
            placeholder="https://api.yourservice.com"
            value={data.endpointUrl}
            onChange={(e) => onChange({ ...data, endpointUrl: e.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="protocol">Protocol</Label>
            <Select
              value={data.protocol}
              onValueChange={(val: "x402" | "MPP") =>
                onChange({ ...data, protocol: val })
              }
            >
              <SelectTrigger id="protocol">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="x402">x402</SelectItem>
                <SelectItem value="MPP">MPP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select
              value={data.method}
              onValueChange={(val: "GET" | "POST" | "PUT" | "DELETE") =>
                onChange({ ...data, method: val })
              }
            >
              <SelectTrigger id="method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="path">Path</Label>
            <Input
              id="path"
              placeholder="/v1/completions"
              value={data.path}
              onChange={(e) => onChange({ ...data, path: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next: Risk Settings
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
