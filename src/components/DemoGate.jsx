import React from "react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown when a feature requires a full account (demo users see this instead of the feature).
 * Use for Field Visualization, export, and other gated areas.
 */
export default function DemoGate({ message = "Create an account to get access.", title = "Account required" }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
          <Button
            onClick={() => User.login()}
            className="w-full"
          >
            Create an account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
