import { useEffect, useState } from "react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import { useToast } from "../components/ui/Toast";

import { listCases } from "../services/caseService";
import type { Case } from "../types/case";


interface ReportModalProps {
  caseId: string;
  caseNumber: string;
  open: boolean;
  setOpen: (value: boolean) => void;
}


function ReportModal({
  caseId,
  caseNumber,
  open,
  setOpen,
}: ReportModalProps) {

  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();


  const handleGenerate = async () => {

    setLoading(true);

    try {

      const token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token");


      const response = await fetch(
        `/api/v1/reports/case/${caseId}/pdf`,
        {
          method: "GET",

          headers: {
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
        }
      );


      if (!response.ok) {

        const errorText = await response.text();

        console.error(
          "Report generation failed:",
          response.status,
          errorText
        );

        throw new Error(
          `Failed to generate report (${response.status})`
        );
      }


      const blob = await response.blob();


      if (blob.size === 0) {
        throw new Error("Generated PDF is empty");
      }


      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `CrimeIntel_Report_${caseNumber}_${new Date()
          .toISOString()
          .split("T")[0]}.pdf`;


      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);


      addToast(
        "success",
        "PDF report generated and downloaded successfully"
      );


      setOpen(false);

    } catch (error) {

      console.error(
        "PDF generation error:",
        error
      );

      addToast(
        "error",
        "Failed to generate PDF report"
      );

    } finally {

      setLoading(false);

    }

  };


  if (!open) {
    return null;
  }


  return (

    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

      <div className="bg-slate-900 rounded-xl p-6 max-w-md w-full border border-slate-600">

        <h3 className="mb-4 text-xl font-semibold text-white text-center">

          Generate Case Report

        </h3>


        <p className="mb-6 text-sm text-slate-400 text-center">

          A PDF report will be generated containing the case details,
          suspects, witnesses, location information and evidence summary.

        </p>


        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full"
        >

          {loading
            ? "Generating PDF..."
            : "Generate & Download PDF"}

        </Button>


        <Button
          onClick={() => setOpen(false)}
          variant="outline"
          className="mt-3 w-full"
          disabled={loading}
        >

          Cancel

        </Button>

      </div>

    </div>

  );

}


export default function ReportsPage() {

  const [cases, setCases] = useState<Case[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedCase, setSelectedCase] =
    useState<Case | null>(null);

  const [modalOpen, setModalOpen] =
    useState(false);


  useEffect(() => {

    async function fetchCases() {

      try {

        setLoading(true);

        const result = await listCases();

        setCases(result.data || []);

      } catch (error) {

        console.error(
          "Failed to load cases:",
          error
        );

      } finally {

        setLoading(false);

      }

    }


    fetchCases();

  }, []);


  const handleGenerateReport = (
    caseItem: Case
  ) => {

    setSelectedCase(caseItem);

    setModalOpen(true);

  };


  return (

    <div className="min-h-screen bg-slate-100">

      <div className="max-w-7xl mx-auto p-4">


        <Card>

          <div className="px-5 py-4 border-b border-slate-300">

            <h2 className="text-2xl font-bold text-slate-900">

              Case Reports

            </h2>


            <p className="text-slate-500">

              Generate and download PDF reports for investigation cases

            </p>

          </div>


          <div className="px-5 py-4">


            {loading ? (

              <EmptyState
                title="Loading Cases"
                description="Fetching available cases..."
              />

            ) : cases.length === 0 ? (

              <EmptyState
                title="No Cases Available"
                description="There are currently no cases available for reporting."
              />

            ) : (

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">


                {cases.map((caseItem) => (

                  <Card
                    key={caseItem.case_id}
                    className="border-none shadow-sm hover:shadow-md transition-shadow"
                  >

                    <div className="px-4 py-3">


                      <h3 className="font-medium text-slate-800 line-clamp-1">

                        {caseItem.title}

                      </h3>


                      <p className="text-xs text-slate-500 mt-2">

                        Case: {caseItem.case_number}

                      </p>


                      <p className="text-xs text-slate-500 mt-1">

                        Status: {caseItem.status}

                      </p>


                      <Button
                        size="sm"
                        onClick={() =>
                          handleGenerateReport(caseItem)
                        }
                        className="w-full mt-4 text-sm"
                      >

                        Generate Report

                      </Button>


                    </div>

                  </Card>

                ))}

              </div>

            )}


          </div>

        </Card>


      </div>


      {selectedCase && (

        <ReportModal

          caseId={selectedCase.case_id}

          caseNumber={selectedCase.case_number}

          open={modalOpen}

          setOpen={setModalOpen}

        />

      )}


    </div>

  );

}