import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, XCircle, Brain } from "lucide-react";
import ReviewContextEnrichment from "./ReviewContextEnrichment";

const EditableField = ({ id, label, value, onChange, type = "text", placeholder }) => (
    <div className="space-y-1">
        <Label htmlFor={id} className="text-xs font-medium text-gray-600">
            {label}
        </Label>
        <Input
            id={id}
            type={type}
            value={value ?? ""}
            onChange={onChange}
            placeholder={placeholder || "Enter value"}
            className="h-9 bg-white"
        />
    </div>
);

export default function YieldTicketReview({
    tickets,
    onUpdateTicket,
    onFinalize,
    onCancel,
    isSaving = false,
    linkedFieldName = null,
    extractedFieldSummary = null,
    registryField = null,
    contextSnapshot = null,
    documentNote = null,
}) {
    const handleFieldChange = (ticket, fieldName, value, isNumeric = false) => {
        let parsedValue = value;
        if (isNumeric) {
            parsedValue = value === "" ? null : parseFloat(value);
            if (isNaN(parsedValue)) parsedValue = null;
        }
        const updated = { ...ticket, [fieldName]: parsedValue };
        onUpdateTicket(updated);
    };

    const handleFinalize = () => {
        onFinalize(tickets);
    };

    return (
        <div className="space-y-6">
            <ReviewContextEnrichment
                registryField={registryField}
                contextSnapshot={contextSnapshot}
                documentNote={documentNote}
                linkedFieldName={linkedFieldName}
            />
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl font-bold text-green-900 mb-2 flex items-center gap-3">
                                <FileText className="w-7 h-7" />
                                Review &amp; enrich — yield ticket evidence
                            </CardTitle>
                            <p className="text-green-700">
                                Confirm ticket values below. Context and field memory appear above; save-to-profile options follow in a later phase.
                            </p>
                            {(linkedFieldName || extractedFieldSummary) && (
                                <div className="mt-3 space-y-1 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-900">
                                    {linkedFieldName && (
                                        <p>
                                            <strong>Linked Field:</strong> {linkedFieldName}
                                        </p>
                                    )}
                                    {extractedFieldSummary && (
                                        <p className="text-green-800">
                                            <strong>Extracted / document field:</strong> {extractedFieldSummary}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        <Badge variant="secondary" className="text-lg">
                            {tickets.length} Ticket{tickets.length !== 1 ? "s" : ""}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-6">
                        {tickets.map((ticket) => (
                            <Card key={ticket.tempId} className="bg-white/60 border-gray-200">
                                <CardHeader className="flex flex-row justify-between items-center p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                        <EditableField
                                            id={`ticketNumber_${ticket.tempId}`}
                                            label="Ticket Number"
                                            type="text"
                                            value={ticket.ticketNumber}
                                            onChange={(e) =>
                                                handleFieldChange(ticket, "ticketNumber", e.target.value)
                                            }
                                        />
                                        <EditableField
                                            id={`ticketDate_${ticket.tempId}`}
                                            label="Ticket Date"
                                            type="date"
                                            value={ticket.ticketDate}
                                            onChange={(e) =>
                                                handleFieldChange(ticket, "ticketDate", e.target.value)
                                            }
                                        />
                                        <EditableField
                                            id={`crop_${ticket.tempId}`}
                                            label="Crop"
                                            type="text"
                                            value={ticket.crop}
                                            onChange={(e) =>
                                                handleFieldChange(ticket, "crop", e.target.value)
                                            }
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <EditableField
                                            id={`vehicleId_${ticket.tempId}`}
                                            label="Truck / Vehicle ID"
                                            type="text"
                                            value={ticket.truckId ?? ticket.vehicleId}
                                            onChange={(e) =>
                                                handleFieldChange(ticket, "truckId", e.target.value)
                                            }
                                        />
                                        <EditableField
                                            id={`grossWeight_${ticket.tempId}`}
                                            label="Gross Weight (lb)"
                                            type="number"
                                            value={ticket.grossWeight}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "grossWeight",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                        <EditableField
                                            id={`tareWeight_${ticket.tempId}`}
                                            label="Tare Weight (lb)"
                                            type="number"
                                            value={ticket.tareWeight}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "tareWeight",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <EditableField
                                            id={`netWeight_${ticket.tempId}`}
                                            label="Net Weight (lb)"
                                            type="number"
                                            value={ticket.netWeight}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "netWeight",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                        <EditableField
                                            id={`moisture_${ticket.tempId}`}
                                            label="Moisture (%)"
                                            type="number"
                                            value={ticket.moisture}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "moisture",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                        <EditableField
                                            id={`testWeight_${ticket.tempId}`}
                                            label="Test Weight (lb/bu)"
                                            type="number"
                                            value={ticket.testWeight}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "testWeight",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <EditableField
                                            id={`grossBushels_${ticket.tempId}`}
                                            label="Gross Bushels (bu)"
                                            type="number"
                                            value={ticket.grossBushels}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "grossBushels",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                        <EditableField
                                            id={`shrink_${ticket.tempId}`}
                                            label="Shrink (bu)"
                                            type="number"
                                            value={ticket.shrink}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "shrink",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                        <EditableField
                                            id={`netBushels_${ticket.tempId}`}
                                            label="Net Bushels (bu)"
                                            type="number"
                                            value={ticket.netBushels ?? ticket.quantityBushels}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "netBushels",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <EditableField
                                            id={`pricePerBushel_${ticket.tempId}`}
                                            label="Price per Bushel ($/bu)"
                                            type="number"
                                            value={ticket.pricePerBushel}
                                            onChange={(e) =>
                                                handleFieldChange(
                                                    ticket,
                                                    "pricePerBushel",
                                                    e.target.value,
                                                    true
                                                )
                                            }
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardFooter className="flex flex-col md:flex-row justify-between items-center gap-4 pt-6">
                    <div className="text-sm text-green-700">
                        <p className="font-semibold">Review and confirm yield ticket values before continuing.</p>
                        <p>Weights, bushels, and price fields are optional but recommended for better summaries.</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            className="flex items-center gap-2 border-red-200 hover:bg-red-50"
                        >
                            <XCircle className="w-4 h-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleFinalize}
                            disabled={isSaving}
                            className={`flex items-center gap-2 ${
                                isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                            }`}
                        >
                            <Brain className="w-4 h-4" />
                            {isSaving ? "Saving…" : "Continue"}
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

