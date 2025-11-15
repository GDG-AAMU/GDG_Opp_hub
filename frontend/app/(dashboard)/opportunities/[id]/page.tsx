"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import OpportunityDetails from "@/components/opportunities/OpportunityDetails";
import { Opportunity } from "@/types";
import { useAuth } from "@/hooks/useAuth";

export default function OpportunityDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // TEMPORARY: Set to true to test admin view
  const isAdmin = false; // Change to: user?.role === "admin" when ready

  useEffect(() => {
    const fetchOpportunity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if backend is enabled
        const useBackend = process.env.NEXT_PUBLIC_USE_BACKEND === "true";

        if (useBackend) {
          // Real API call
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/opportunities/${params.id}`
          );

          if (!response.ok) {
            if (response.status === 404) {
              setError("Opportunity not found");
            } else {
              setError("Failed to load opportunity");
            }
            return;
          }

          const data = await response.json();
          setOpportunity(data);
        } else {
          // Mock data for development
          await new Promise((resolve) => setTimeout(resolve, 800));

          const mockData: Opportunity = {
            id: params.id,
            company_name: "Google",
            job_title: "Software Engineering Intern",
            description:
              "Join our team to work on cutting-edge technology that impacts billions of users worldwide. You will collaborate with experienced engineers on real projects.",
            requirements:
              "Currently pursuing a BS/MS in Computer Science or related field. Strong programming skills in Java, C++, or Python. Understanding of data structures and algorithms.",
            opportunity_type: "internship",
            location: "Mountain View, CA",
            deadline: "2025-11-20",
            role_type: "Software Engineering",
            relevant_majors: [
              "Computer Science",
              "Software Engineering",
              "Information Technology",
            ],
            submitted_by: "john.doe@example.com",
            created_at: "2025-11-01",
            status: "active",
            url: "https://careers.google.com/jobs/123",
            expired_at: null,
            ai_parsed_data: null,
          };

          setOpportunity(mockData);
        }
      } catch (err) {
        console.error("Error fetching opportunity:", err);
        setError("An error occurred while loading the opportunity");
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunity();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading opportunity details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-8">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-700">{error || "Opportunity not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Opportunity Details Card */}
        <OpportunityDetails opportunity={opportunity} isAdmin={isAdmin} />
      </div>
    </div>
  );
}

