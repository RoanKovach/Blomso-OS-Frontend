import React from 'react';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function QuickStatsCards({ title, value, icon: Icon, bgColor = 'bg-emerald-500', trend }) {
  const displayValue = value === null || value === undefined ? "--" : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="relative overflow-hidden border-none shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
        <div className={`absolute top-0 right-0 w-24 h-24 transform translate-x-6 -translate-y-6 ${bgColor} rounded-full opacity-15`} />
        <CardHeader className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700 mb-1">{title}</p>
              <CardTitle className="text-2xl md:text-3xl font-bold text-green-900 mb-2">
                {displayValue}
              </CardTitle>
              {trend && displayValue !== '--' && (
                <div className="flex items-center text-sm">
                  <span className="text-gray-600 font-medium">{trend}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20 backdrop-blur-sm`}>
              <Icon className={`w-6 h-6 ${bgColor.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );
}