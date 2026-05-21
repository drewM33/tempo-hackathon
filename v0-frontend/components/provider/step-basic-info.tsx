"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_CATEGORIES } from "@/lib/marketplace-data";
import { ArrowRight } from "lucide-react";

export interface BasicInfoData {
  name: string;
  description: string;
  category: string;
  tags: string;
}

interface StepBasicInfoProps {
  data: BasicInfoData;
  onChange: (data: BasicInfoData) => void;
  onNext: () => void;
}

export function StepBasicInfo({ data, onChange, onNext }: StepBasicInfoProps) {
  const isValid = data.name.trim().length > 0 && data.description.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Basic Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about your API service.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider-name">Provider Name</Label>
          <Input
            id="provider-name"
            placeholder="e.g., ElevenLabs, Anthropic, RealAPI..."
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Short Description</Label>
          <Textarea
            id="description"
            placeholder="One or two sentences about your API..."
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={data.category}
            onValueChange={(val) => onChange({ ...data, category: val })}
          >
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_CATEGORIES.filter((c) => c !== "All Deals").map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="e.g., llm, voice, search (comma-separated)"
            value={data.tags}
            onChange={(e) => onChange({ ...data, tags: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Comma-separated tags for discovery.</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!isValid}>
          Next: Trial Config
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
