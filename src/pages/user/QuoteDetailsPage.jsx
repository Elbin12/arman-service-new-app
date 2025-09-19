"use client"

import { useRef, useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Stack,
  Avatar,
  Container,
  Grid,
  Collapse,
  IconButton,
  Alert,
  AlertTitle,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material"
import {
  Receipt,
  ArrowBack,
  ExpandMore,
  ExpandLess,
  Check,
  Close,
  Add,
  AccessTime,
  CheckCircle,
  PictureAsPdf,
  Gavel,
} from "@mui/icons-material"
import {
  useCreateScheduleMutation,
  useGetGlobalPriceQuery,
  useGetQuoteDetailsQuery,
} from "../../store/api/user/quoteApi"
import { Info, Plus } from "lucide-react"
import { handleDownloadPDF } from "../../utils/handleDownloadPDF"

const statusStyles = {
  pending: { bgcolor: "warning.light", color: "warning.dark" },
  approved: { bgcolor: "success.light", color: "success.dark" },
  rejected: { bgcolor: "error.light", color: "error.dark" },
  submitted: { bgcolor: "info.light", color: "info.dark" },
  draft: { bgcolor: "grey.100", color: "grey.800" },
  responses_completed: { bgcolor: "success.light", color: "success.dark" },
}

const formatYesNo = (val) => {
  if (val === true) return "Yes"
  if (val === false) return "No"
  return "N/A"
}

const QuoteDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [expandedServices, setExpandedServices] = useState({})
  const [selectedDate, setSelectedDate] = useState(null)
  const [activeTab, setActiveTab] = useState("recurring")
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const {
    data: quote,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetQuoteDetailsQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const { data: globalPriceData } = useGetGlobalPriceQuery()

  const [createSchedule] = useCreateScheduleMutation()

  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)

  const firstName = queryParams.get("first_name")
  const lastName = queryParams.get("last_name")
  const phone = queryParams.get("phone")
  const email = queryParams.get("email")
  const iframeRef = useRef(null)

  const params = new URLSearchParams()
  const [iframeLoaded, setIframeLoaded] = useState(false)

  if (firstName) params.append("first_name", firstName)
  if (lastName) params.append("last_name", lastName)
  if (phone) params.append("phone", phone)
  if (email) params.append("email", email)
  const paramsString = params.toString()

  const isInIframe = typeof window !== "undefined" && window.self !== window.top
  const PRIMARY_BOOKING_ID = "1rwE7cUSN5MxPeI1CHiB"
  const IFRAME_BOOKING_ID = "Bh99EZHXlRpJ0CfqwDEW"
  const bookingId = isInIframe ? IFRAME_BOOKING_ID : PRIMARY_BOOKING_ID
  const iframeSrc = `https://links.theservicepilot.com/widget/booking/${bookingId}${paramsString ? `?${paramsString}` : ""}`

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://links.theservicepilot.com/js/form_embed.js"
    script.async = true

    script.onload = () => {
      console.log("Form embed script loaded.")
    }

    const timer = setTimeout(() => {
      if (iframeRef.current) {
        document.body.appendChild(script)
      }
    }, 500)

    return () => {
      clearTimeout(timer)
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Expand all services by default
  useEffect(() => {
    if (quote?.service_selections) {
      const initialExpanded = {}
      quote.service_selections.forEach((service) => {
        initialExpanded[service.id] = true
      })
      setExpandedServices(initialExpanded)
    }
  }, [quote])

  const toggleServiceExpansion = (serviceId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }))
  }

  const handleSchedule = async () => {
    if (!selectedDate) return
    console.log("Scheduled date:", selectedDate, quote.quote_schedule?.quoted_by)
    const payload = {
      id: quote.id,
      scheduled_date: selectedDate,
      is_submitted: true,
      quoted_by: quote.quote_schedule?.quoted_by,
    }
    try {
      const response = await createSchedule(payload).unwrap()
      await refetch()
    } catch (err) {
      console.error("Failed.", err)
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: "#023c8f" }} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading quote details...
        </Typography>
      </Box>
    )
  }

  if (isError || !quote) {
    return (
      <Box p={4}>
        <Button startIcon={<ArrowBack />} variant="text" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography variant="h5" color="error" gutterBottom>
          Failed to load quote
        </Typography>
        <Typography variant="body2">{error?.message || "Quote not found or something went wrong."}</Typography>
      </Box>
    )
  }

  const {
    contact,
    address,
    house_sqft,
    location_details,
    status,
    total_base_price,
    total_adjustments,
    total_surcharges,
    final_total,
    created_at,
    expires_at,
    service_selections,
    quote_surcharge_applicable,
    additional_data,
    custom_products,
    custom_service_total,
    quote_schedule,
  } = quote

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return numPrice.toFixed(2)
  }

  const renderQuestionResponse = (response) => {
    switch (response.question_type) {
      case "yes_no":
      case "conditional":
        return response.yes_no_answer ? "Yes" : "No"
      case "multiple_yes_no":
        return (
          response.sub_question_responses
            .filter((sub) => sub.answer)
            .map((sub) => sub.sub_question_text)
            .join(", ") || "None selected"
        )
      case "quantity":
        return response.option_responses.map((opt) => `${opt.option_text}: ${opt.quantity}`).join(", ")
      case "describe":
        return response.option_responses.map((opt) => opt.option_text).join(", ")
      default:
        return "N/A"
    }
  }

  // Terms and Conditions Content Component
  const TermsContent = () => (
    <Box>
      {/* Tabs */}
      <Box display="flex" justifyContent="center" mb={3}>
        <Box display="flex" borderBottom={1} borderColor="divider">
          <Button
            onClick={() => setActiveTab("recurring")}
            sx={{
              px: 2,
              py: 1,
              fontSize: "0.875rem",
              fontWeight: 500,
              borderBottom: activeTab === "recurring" ? 2 : 0,
              borderColor: activeTab === "recurring" ? "primary.main" : "transparent",
              color: activeTab === "recurring" ? "primary.main" : "text.secondary",
              "&:hover": { color: "text.primary" },
              textTransform: "none",
              borderRadius:0
            }}
          >
            Recurring Service Terms
          </Button>
          <Button
            onClick={() => setActiveTab("terms")}
            sx={{
              px: 2,
              py: 1,
              fontSize: "0.875rem",
              fontWeight: 500,
              borderBottom: activeTab === "terms" ? 2 : 0,
              borderColor: activeTab === "terms" ? "primary.main" : "transparent",
              color: activeTab === "terms" ? "primary.main" : "text.secondary",
              "&:hover": { color: "text.primary" },
              textTransform: "none",
              borderRadius:0
            }}
          >
            Terms and Conditions
          </Button>
          {/* <Button
            onClick={() => setActiveTab("specs")}
            sx={{
              px: 2,
              py: 1,
              fontSize: "0.875rem",
              fontWeight: 500,
              borderBottom: activeTab === "specs" ? 2 : 0,
              borderColor: activeTab === "specs" ? "primary.main" : "transparent",
              color: activeTab === "specs" ? "primary.main" : "text.secondary",
              "&:hover": { color: "text.primary" },
              textTransform: "none",
            }}
          >
            Job Specs
          </Button> */}
        </Box>
      </Box>

      {/* Tab Content */}
      {activeTab === "recurring" && (
        <Box sx={{ maxHeight: "400px", overflow: "auto", pr: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Recurring Service Agreement (Window Cleaning & Gutter Cleaning)
          </Typography>
          <Box sx={{ color: "text.secondary", fontSize: "0.875rem", "& > *": { mb: 1.5 } }}>
            <Typography variant="body2">
              This Recurring Service Agreement outlines the terms and conditions for ongoing window cleaning and/or gutter cleaning services provided by TruShine Window Cleaning.
            </Typography>

            {/* 1. Scope of Services */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              1. Scope of Services
            </Typography>
            <Typography variant="body2">TruShine agrees to perform recurring services, which may include:</Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>Window Cleaning:</strong>
                <ul style={{ marginLeft: "20px" }}>
                  <li>Exterior window cleaning for all accessible glass</li>
                  <li>Optional interior window cleaning if included</li>
                  <li>Add-on services such as screen cleaning, track detailing, and hard water removal are available for an additional fee</li>
                </ul>
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Gutter Cleaning:</strong>
                <ul style={{ marginLeft: "20px" }}>
                  <li>Removal of leaves and debris from gutters</li>
                  <li>Flushing of downspouts to ensure proper water flow</li>
                  <li>Light roof debris removal near gutter lines when safely accessible</li>
                </ul>
              </Typography>
              <Typography component="li" variant="body2">
                Services will be performed on a recurring basis according to the selected frequency (monthly, bi-monthly, quarterly, semi-annual, or annual) and will continue until canceled per the terms below.
              </Typography>
            </Box>

            {/* 2. Pricing & Payment Terms */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              2. Pricing & Payment Terms
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">Clients on recurring service receive <strong>discounted pricing</strong> compared to one-time service rates</Typography>
              <Typography component="li" variant="body2">Pricing is based on property size, service scope, and access conditions</Typography>
              <Typography component="li" variant="body2">Payment is due upon completion of each service unless prepaid or otherwise agreed</Typography>
              <Typography component="li" variant="body2">A valid credit card must be kept on file for automated billing; receipts are sent via email after each charge</Typography>
            </Box>

            {/* 3. Term, Renewal & Cancellation */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              3. Term, Renewal & Cancellation
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                <strong>Agreement Terms by Frequency:</strong>
                <ul style={{ marginLeft: "20px" }}>
                  <li><strong>Monthly, Bi-Monthly, Quarterly, and Semi-Annual Services:</strong> Require a <strong>minimum commitment of one full year</strong></li>
                  <li><strong>Quarterly Services:</strong> Minimum of <strong>4 scheduled services</strong></li>
                  <li><strong>Semi-Annual Services:</strong> Minimum of <strong>2 scheduled services</strong></li>
                  <li><strong>Annual Services:</strong> Require a <strong>minimum 2-year commitment with at least 2 scheduled services per year</strong></li>
                </ul>
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Termination Rights:</strong>
                <ul style={{ marginLeft: "20px" }}>
                  <li>Either party may terminate this agreement <strong>after the minimum service commitment is met</strong> by providing at least <strong>14 days' written notice</strong></li>
                  <li>TruShine reserves the right to cancel or reschedule service due to weather, safety concerns, or access limitations</li>
                </ul>
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Early Cancellation Policy:</strong>
                <ul style={{ marginLeft: "20px" }}>
                  <li>If the client cancels <strong>before fulfilling their minimum service term</strong>, a cancellation fee will apply</li>
                  <li>This fee equals the <strong>difference between the discounted recurring rate and the standard one-time service rate</strong> (plus tax) for all completed services</li>
                  <li>The cancellation fee will be <strong>charged to the card on file</strong> on the day of cancellation</li>
                </ul>
              </Typography>
              <Typography component="li" variant="body2">
                <strong>Post-Term Continuation:</strong>
                <ul style={{ marginLeft: "20px" }}>
                  <li>Once the initial contract term is met, services will continue at the same recurring rate unless the client provides written notice to cancel</li>
                  <li>No price increases will apply without client approval or advance written notice</li>
                </ul>
              </Typography>
            </Box>

            {/* 4. Client Responsibilities */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              4. Client Responsibilities
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">Ensure all service areas are accessible on scheduled service dates (e.g., gates unlocked, pets secured)</Typography>
              <Typography component="li" variant="body2">Notify TruShine of any pre-existing issues, fragile items, or safety concerns prior to service</Typography>
              <Typography component="li" variant="body2">Communicate promptly about scheduling changes or property access restrictions</Typography>
            </Box>

            {/* 5. Service Adjustments */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              5. Service Adjustments
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">Service pricing may be updated if property conditions change or if the service scope is modified</Typography>
              <Typography component="li" variant="body2">Clients may request upgrades, frequency changes, or add-on services with written notice</Typography>
              <Typography component="li" variant="body2">TruShine will always provide advance notice of any pricing updates</Typography>
            </Box>

            {/* 6. Insurance & Liability */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              6. Insurance & Liability
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">TruShine is fully insured and exercises care during all services</Typography>
              <Typography component="li" variant="body2">TruShine is not responsible for pre-existing damage such as aged gutters, broken seals, or cracked panes</Typography>
              <Typography component="li" variant="body2">Any service concerns must be reported within <strong>48 hours</strong> of completion for review and resolution</Typography>
            </Box>

            <Typography variant="body2">
              By continuing recurring services with TruShine Window Cleaning, the client acknowledges and agrees to all terms outlined in this agreement.
            </Typography>
          </Box>
        </Box>
      )}

      {activeTab === "terms" && (
        <Box sx={{ maxHeight: "400px", overflow: "auto", pr: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Terms and Conditions
          </Typography>
          <Box
            sx={{
              color: "text.secondary",
              fontSize: "0.75rem",
              "& > *": { mb: 1.5 },
            }}
          >
            {/* GENERAL TERMS */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              GENERAL TERMS
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                Any special accommodations must be reviewed and approved by TWC management before accepting the proposal.
              </Typography>
              <Typography component="li" variant="body2">
                Quotations are valid for 30 days and must be accepted in writing (signature or electronic acceptance).
              </Typography>
              <Typography component="li" variant="body2">
                All work will be completed in a professional, workmanlike manner, in compliance with local codes/regulations.
              </Typography>
              <Typography component="li" variant="body2">
                TWC is properly insured against injury to employees and losses from employee actions.
              </Typography>
              <Typography component="li" variant="body2">
                TWC reserves the right to update these Terms and Conditions at any time.
              </Typography>
            </Box>

            {/* WINDOW CLEANING */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              WINDOW CLEANING
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                All windows must be securely closed on the day of service.
              </Typography>
              <Typography component="li" variant="body2">
                Client responsible for ensuring items are structurally sound. TWC may document/refuse questionable items.
              </Typography>
              <Typography component="li" variant="body2">
                Full access required; obstacles will not be moved. $75 trip fee if no access available.
              </Typography>
              <Typography component="li" variant="body2">
                Unsafe/inaccessible windows will not be cleaned.
              </Typography>
              <Typography component="li" variant="body2">
                External glass cleaned with water-fed pole using pure water, left to dry naturally.
              </Typography>
              <Typography component="li" variant="body2">
                “Window” includes frame, sill, sash, and glass (wood, aluminum, steel, UPVC). Brick/tile/stone sills excluded.
              </Typography>
              <Typography component="li" variant="body2">
                36-hour Streak-Free Guarantee on all window cleaning packages.
              </Typography>
            </Box>

            {/* PRESSURE WASHING */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              PRESSURE WASHING
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                Pressure washing removes most stains; some marks may remain.
              </Typography>
              <Typography component="li" variant="body2">
                External water access is required.
              </Typography>
              <Typography component="li" variant="body2">
                Client must cover/remove outdoor furniture. $150 fee if TWC must do it. Not liable for chemical damage.
              </Typography>
              <Typography component="li" variant="body2">
                3-day satisfaction guarantee on premium pressure washing packages only.
              </Typography>
            </Box>

            {/* GUTTER CLEANING */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              GUTTER CLEANING
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                Basic cleaning includes clearing internal gutters only. Hauling debris/repairs not included unless agreed.
              </Typography>
              <Typography component="li" variant="body2">
                Cleaning done via leaf blower; downspouts flushed with hose.
              </Typography>
              <Typography component="li" variant="body2">
                Exterior gutter surface cleaning not included (available at additional cost).
              </Typography>
              <Typography component="li" variant="body2">
                15-day guarantee on all gutter cleaning packages.
              </Typography>
            </Box>

            {/* AWNING CLEANING */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              AWNING CLEANING
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                TWC not liable for unexpected damage during awning cleaning.
              </Typography>
              <Typography component="li" variant="body2">
                Service may be declined if material is over 5 years old or fails inspection.
              </Typography>
              <Typography component="li" variant="body2">
                24-hour guarantee on all awning cleaning services.
              </Typography>
            </Box>

            {/* RESCHEDULING, CANCELLATION & CLIENT RESPONSIBILITIES */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              RESCHEDULING, CANCELLATION & CLIENT RESPONSIBILITIES
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                Each client may reschedule up to 2 times, within 7 days of original date.
              </Typography>
              <Typography component="li" variant="body2">
                Rescheduling/cancellation within 8 hours: $35 fee.
              </Typography>
              <Typography component="li" variant="body2">
                More than 8 hours in advance: free (first 2 times).
              </Typography>
              <Typography component="li" variant="body2">
                Beyond 2 reschedules may incur full service amount fee.
              </Typography>
              <Typography component="li" variant="body2">
                TruShine not liable for delays due to weather/supply/uncontrollable issues.
              </Typography>
            </Box>

            {/* PAYMENTS */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              PAYMENTS
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                Payment due upon completion unless otherwise agreed.
              </Typography>
              <Typography component="li" variant="body2">
                TWC may require credit card info or $100 deposit. Jobs needing materials: 50% deposit.
              </Typography>
              <Typography component="li" variant="body2">
                Accepted: cash, check, credit card (in person, phone, or online).
              </Typography>
              <Typography component="li" variant="body2">
                Commercial account payments can be mailed to: 3525 Murdock ST, Houston, TX 77047.
              </Typography>
              <Typography component="li" variant="body2">
                Clients with unpaid balances may be denied further service.
              </Typography>
              <Typography component="li" variant="body2">
                Disputed payments are client’s responsibility. Late/recovery fees may apply.
              </Typography>
            </Box>

            {/* LATE FEES */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              LATE FEES
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                Residential: 10% late fee after 1 day.
              </Typography>
              <Typography component="li" variant="body2">
                Commercial: 10% late fee after 30 days.
              </Typography>
              <Typography component="li" variant="body2">
                Balances unpaid after 60 days sent to collections (including legal fees).
              </Typography>
            </Box>

            {/* OTHER POLICIES */}
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "text.primary" }}>
              OTHER POLICIES
            </Typography>
            <Box component="ul" sx={{ pl: 3, m: 0 }}>
              <Typography component="li" variant="body2">
                All sales final. Refunds only for unused material during service.
              </Typography>
              <Typography component="li" variant="body2">
                14-day written notice required for cancellation. Less notice = full charge.
              </Typography>
              <Typography component="li" variant="body2">
                All services subject to applicable Texas state TAX.
              </Typography>
              <Typography component="li" variant="body2">
                If a complaint revisit finds work satisfactory, $75 trip fee applies.
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ fontWeight: 600, mt: 2 }}>
              By accepting the proposal, electronically or in writing, you agree to all the terms outlined above.
            </Typography>
          </Box>
        </Box>
      )}


      {activeTab === "specs" && (
        <Box sx={{ maxHeight: "400px", overflow: "auto", pr: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Job Specifications
          </Typography>
          <Box sx={{ color: "text.secondary", fontSize: "0.875rem" }}>
            <Typography variant="body2" paragraph>
              Detailed job specifications will be confirmed based on your selected services and property assessment.
            </Typography>
            <Typography variant="body2" paragraph>
              Our team will review all service areas during the initial visit to ensure proper execution according to
              your quote specifications.
            </Typography>
            <Typography variant="body2">
              Any additional requirements or changes to the original scope will be discussed and approved before
              implementation.
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )

  return (
    <Box className="min-h-screen" sx={{ background: "linear-gradient(135deg,#f0f4f9 0%,#e2e8f0 70%)", pb: 6 }}>
      {/* Header */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: 1,
          borderColor: "divider",
          mb: 4,
          py: 2,
        }}
        className="fixed w-full z-20"
      >
        <Box
          maxWidth="1200px"
          mx="auto"
          px={{ xs: 2, md: 4 }}
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "center" }}
          gap={{ xs: 2, md: 4 }}
        >
          {/* Left side - Logo & Quote Info */}
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Box
              component="img"
              src="https://storage.googleapis.com/msgsndr/b8qvo7VooP3JD3dIZU42/media/683efc8fd5817643ff8194f0.jpeg"
              alt="Company Logo"
              sx={{
                height: { xs: 40, sm: 70 },
                width: "auto",
                borderRadius: 1,
              }}
            />
            <Box>
              <Typography variant="h4" color="#023c8f" fontWeight="600"
                sx={{
                  fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" }, // xs=h6-ish, sm=h5, md=h4
                }}
              >
                Quote Details
              </Typography>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={1} mt={0.5}>
                <Typography variant="body2" color="text.secondary">
                  ID: {quote.id}
                </Typography>
                <Chip
                  label={status?.charAt(0).toUpperCase() + status?.slice(1)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    borderRadius: 1,
                    ...(statusStyles[status?.toLowerCase()] || statusStyles["draft"]),
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Created: {new Date(created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right side - Buttons */}
          <Box
            display="flex"
            flexDirection={{  xs: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            gap={2}
            width={{ xs: "100%", sm: "auto" }}
          >
            <Button
              variant="outlined"
              onClick={() =>
                handleDownloadPDF(
                  setIsGeneratingPDF,
                  quote,
                  contact,
                  address,
                  quote_schedule,
                  service_selections,
                  custom_products,
                  globalPriceData,
                  additional_data,
                  house_sqft
                )
              }
              disabled={isGeneratingPDF}
              startIcon={isGeneratingPDF ? <CircularProgress size={16} /> : <PictureAsPdf />}
              sx={{
                borderColor: "#42bd3f",
                color: "#42bd3f",
                "&:hover": {
                  bgcolor: "rgba(66, 189, 63, 0.04)",
                  borderColor: "#42bd3f",
                },
              }}
              fullWidth={{ xs: true, sm: false }}
            >
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Button>

            {window.self !== window.top && (
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate("/")}
                sx={{
                  px: { xs: 2, md: 4 },
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: "1rem",
                  background: "linear-gradient(90deg, #023c8f, #0056d3)",
                  "&:hover": {
                    background: "linear-gradient(90deg, #012a6b, #004bb8)",
                  },
                }}
                startIcon={<Plus size={20} />}
                fullWidth={{ xs: true, sm: false }}
              >
                Start New Quote
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box maxWidth="1400px" className="py-32" mx="auto" px={{ xs: 2, md: 4 }}>
        <Container maxWidth="lg">
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "2fr 1fr" }} gap={6}>
            {/* Left column */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Customer Info */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: "#023c8f" }}>
                    Customer Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {contact?.first_name} {contact?.last_name}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{contact?.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{contact?.phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        House sq ft
                      </Typography>
                      <Typography variant="body1">{house_sqft} sq ft</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">
                        {address?.name} — {address?.street_address}, {address?.city}, {address?.state},{" "}
                        {address?.postal_code}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Enhanced Scheduling Section */}
              {!quote_schedule?.is_submitted ? (
                <Box
                  sx={{
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    {!iframeLoaded && (
                      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                        <CircularProgress size={24} sx={{ color: "#023c8f" }} />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          Loading scheduler...
                        </Typography>
                      </Box>
                    )}
                    <iframe
                      ref={iframeRef}
                      src={iframeSrc}
                      style={{
                        width: "100%",
                        border: "none",
                        overflow: "hidden",
                        height: iframeLoaded ? "950px" : "600px",
                        display: iframeLoaded ? "block" : "none",
                      }}
                      scrolling="no"
                      onLoad={() => setIframeLoaded(true)}
                    />
                  </CardContent>
                </Box>
              ) : (
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 3,
                    background: "linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%)",
                  }}
                >
                  <Box
                    sx={{
                      background: "linear-gradient(135deg, #42bd3f 0%, #369932 100%)",
                      color: "white",
                      px: 4,
                      py: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      borderRadius: "12px 12px 0 0",
                    }}
                  >
                    <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 40, height: 40 }}>
                      <CheckCircle />
                    </Avatar>
                    <Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                        Scheduled
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        Your service is confirmed
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 4 }}>
                    <Alert
                      severity="success"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.8)",
                        border: "none",
                        borderRadius: 2,
                      }}
                    >
                      <AlertTitle sx={{ fontWeight: 600 }}>Service Scheduled!</AlertTitle>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Date & Time (UTC):</strong>
                        <br />
                        {new Date(quote_schedule?.scheduled_date).toLocaleDateString("en-GB", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                        <br />
                        <AccessTime sx={{ mr: 1, verticalAlign: "middle", fontSize: 16 }} />
                        {new Date(quote_schedule?.scheduled_date).toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,   // 👈 ensures AM/PM format
                          timeZone: "UTC",
                        })
                        .replace("am", "AM")
                        .replace("pm", "PM")
                        }
                      </Typography>
                    </Alert>

                    <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
                      Our team will contact you before the scheduled date to confirm details
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Service Selections */}
              {service_selections?.map((selection) => (
                <Card key={selection.id}>
                  {/* Service Header */}
                  <Box
                    sx={{
                      px: 3,
                      py: 0.5,
                      backgroundColor: "#023c8f",
                      color: "white",
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#012a6b" },
                    }}
                    onClick={() => toggleServiceExpansion(selection.id)}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" fontWeight={600} sx={{ color: "white" }}>
                          {selection.service_details?.name}
                        </Typography>
                      </Box>
                      <IconButton sx={{ color: "white" }}>
                        {expandedServices[selection.id] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Collapsible Content */}
                  <Collapse in={expandedServices[selection.id]} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 3, py: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {selection.service_details?.description}
                      </Typography>

                      {/* Selected Package Display */}
                      {selection.selected_package_details && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: "#023c8f" }}>
                            Selected Package
                          </Typography>
                          <Card
                            variant="outlined"
                            sx={{
                              border: "2px solid #42bd3f",
                              bgcolor: "#f8fff8",
                              borderRadius: 3,
                              minHeight: 220,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <CardContent sx={{ p: 4 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight={700}>
                                  {selection.selected_package_details.name}
                                </Typography>
                                <Chip
                                  label="Selected"
                                  sx={{
                                    bgcolor: "#42bd3f",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              <Typography variant="h4" sx={{ color: "#42bd3f", fontWeight: 700, mb: 2 }}>
                                ${formatPrice(selection.final_total_price)}
                              </Typography>

                              {/* Features List */}
                              <Box>
                                {selection.package_quotes?.[0] && (
                                  <>
                                    {[
                                      ...(selection.package_quotes[0].included_features_details || []).map((f) => ({
                                        ...f,
                                        included: true,
                                      })),
                                      ...(selection.package_quotes[0].excluded_features_details || []).map((f) => ({
                                        ...f,
                                        included: false,
                                      })),
                                    ].map((feature) => (
                                      <Box key={feature.id} display="flex" alignItems="center" mb={0.8}>
                                        {feature.included ? (
                                          <Check sx={{ fontSize: 18, color: "#42bd3f", mr: 1 }} />
                                        ) : (
                                          <Close sx={{ fontSize: 18, color: "#9e9e9e", mr: 1 }} />
                                        )}
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: feature.included ? "text.primary" : "text.disabled",
                                            fontWeight: feature.included ? 500 : 400,
                                          }}
                                        >
                                          {feature.name}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      {/* Question Responses */}
                      {selection.question_responses?.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#023c8f", mb: 1 }}>
                            Question Responses
                          </Typography>
                          <Box sx={{ bgcolor: "#f8f9fa", borderRadius: 1, p: 1 }}>
                            {selection.question_responses.map((response, index) => (
                              <Box key={response.id} sx={{ display: 'flex', mb: 0.5, alignItems: 'flex-start' }}>
                                <Typography variant="body2" sx={{ color: "#023c8f", fontWeight: 600, mr: 1, minWidth: '25px', fontSize: '0.8125rem' }}>
                                  Q{index + 1}:
                                </Typography>
                                <Typography variant="body2" sx={{ flex: 1, mr: 1, fontSize: '0.8125rem' }}>
                                  {response.question_text}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 'fit-content', fontSize: '0.8125rem' }}>
                                  {renderQuestionResponse(response)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Card>
              ))}

              {/* Custom Products/Services */}
              {custom_products.filter((c)=>c.is_active===true) && custom_products.filter((c)=>c.is_active===true).length > 0 && (
                <Card>
                  <Box sx={{ p: 3, py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Add />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: "#023c8f" }}>
                          Custom Services
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {custom_products.filter((c)=>c.is_active===true).length} custom service{custom_products.filter((c)=>c.is_active===true).length > 1 ? "s" : ""} added
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ overflow: "hidden" }}>
                    {custom_products.filter((c)=>c.is_active===true).map((product, index) => (
                      <Box
                        key={product.id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 3,
                          borderBottom: index < custom_products.filter((c)=>c.is_active===true).length - 1 ? "1px solid #f0f0f0" : "none",
                          "&:hover": {
                            bgcolor: "#f8f9fa",
                          },
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#023c8f", mb: 0.5 }}>
                            {product.product_name}
                          </Typography>
                          {product.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {product.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                          <Typography variant="h6" fontWeight={700} sx={{ color: "#42bd3f" }}>
                            ${formatPrice(product.price)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Card>
              )}

              {/* Additional Information */}
              {additional_data && (additional_data?.signature || additional_data?.additional_notes) && (
                <Card>
                  <Box sx={{ p: 3, py: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Info />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: "#023c8f" }}>
                        Additional Information
                      </Typography>
                    </Stack>
                  </Box>
                  <Divider />
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 2 }}>
                          Terms & Conditions
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => setShowTermsDialog(true)}
                          startIcon={<Gavel />}
                          sx={{
                            borderColor: "#023c8f",
                            color: "#023c8f",
                            "&:hover": {
                              bgcolor: "rgba(2, 60, 143, 0.04)",
                              borderColor: "#023c8f",
                            },
                          }}
                        >
                          View Terms & Conditions
                        </Button>
                      </Box>

                      {additional_data.signature && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                            Signature
                          </Typography>
                          <img
                            src={`data:image/png;base64,${additional_data.signature}`}
                            alt="Signature"
                            style={{ border: "1px solid #ccc", maxWidth: "200px" }}
                          />
                        </Box>
                      )}

                      {additional_data.additional_notes && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                            Additional Notes
                          </Typography>
                          <Box
                            sx={{
                              border: "1px solid #334155",
                              borderRadius: 1,
                              p: 2,
                            }}
                          >
                            <Typography variant="body2">{additional_data.additional_notes}</Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Right column - pricing */}
            <Box>
              <Paper elevation={3} sx={{ borderRadius: 2, position: "sticky", top: 80, overflow: "hidden" }}>
                <Box
                  sx={{
                    background: "#023c8f",
                    color: "white",
                    px: 3,
                    py: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Receipt fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pricing Summary
                  </Typography>
                </Box>

                <CardContent>
                  <Box display="flex" flexDirection="column" gap={2}>
                    {/* Sum of services */}
                    {service_selections?.map((service) => (
                      <Box
                        key={service.id}
                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <Typography variant="body2">{service.service_details?.name}</Typography>
                        <Typography variant="subtitle2">${formatPrice(service.final_total_price)}</Typography>
                      </Box>
                    ))}

                    {/* Custom Services Price */}
                    {custom_service_total && Number.parseFloat(custom_service_total) > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2">Custom Services</Typography>
                        <Typography variant="subtitle2">${formatPrice(custom_service_total)}</Typography>
                      </Box>
                    )}

                    {/* Calculate totals */}
                    {(() => {
                      const totalServicePrice =
                        service_selections?.reduce((sum, s) => sum + Number(s.final_total_price || 0), 0) || 0

                      const subtotal = totalServicePrice+Number(custom_service_total)


                      const final = formatPrice(final_total + custom_service_total); // numeric addition
                      // const final = formatPrice(final_total) + formatPrice(custom_service_total)
                      console.log(final, custom_service_total, typeof(final))
                      const taxRate = 0.0825 // 8.25% tax
                      const taxAmount = final * taxRate
                      const finalWithTax = Number(final) + taxAmount
                      console.log(taxAmount, typeof(final))

                      return (
                        <>
                          {/* Adjustments */}
                          {/* <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="body2">Adjustments</Typography>
                            <Typography variant="subtitle2">${formatPrice(adjustment)}</Typography>
                          </Box> */}

                          {/* Tax */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Typography variant="body2">Tax (8.25%)</Typography>
                            <Typography variant="subtitle2">${formatPrice(taxAmount)}</Typography>
                          </Box>

                          {/* Note if subtotal < base price */}
                          {subtotal < (globalPriceData?.base_price || 0) && (
                            <Typography variant="caption" color="error">
                              Note: Minimum base price is ${formatPrice(globalPriceData?.base_price || 0)}
                            </Typography>
                          )}

                          <Divider />

                          {/* Final Total */}
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              background: "rgba(243,244,246,0.5)",
                              p: 1,
                              borderRadius: 1,
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight="600">
                              Final Total
                            </Typography>
                            <div className="flex flex-col">
                              <Typography variant="h5" fontWeight="500" color="#42bd3f">
                                ${Math.round(finalWithTax)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" align="center">
                                Tax included
                              </Typography>
                            </div>
                          </Box>
                        </>
                      )
                    })()}

                    <Divider />
                    <Typography variant="caption" color="text.secondary" align="center">
                      Quote created on{" "}
                      {new Date(created_at).toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>
                  </Box>
                </CardContent>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Terms & Conditions Dialog */}
      <Dialog
        open={showTermsDialog}
        onClose={() => setShowTermsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "80vh",
          },
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#023c8f",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Gavel />
          Terms & Conditions
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TermsContent />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={() => setShowTermsDialog(false)}
            variant="contained"
            sx={{
              bgcolor: "#023c8f",
              "&:hover": { bgcolor: "#012a6b" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default QuoteDetailsPage
