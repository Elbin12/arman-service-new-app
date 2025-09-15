export const handleDownloadPDF = async (
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
) => {
  setIsGeneratingPDF(true)
  try {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()

    const colors = {
      black: "#000000",
      gray: "#666666",
      lightGray: "#f5f5f5",
    }

    let yPosition = 20
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    const margin = 20
    const lineHeight = 6
    const maxLineWidth = pageWidth - margin * 2

    const checkPageBreak = (linesNeeded = 1) => {
      if (yPosition + linesNeeded * lineHeight > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
      }
    }

    const formatPrice = (price) => {
      const num = Number(price)
      return isNaN(num) ? "$0.00" : `$${num.toFixed(2)}`
    }

    const addWrappedText = (text, x, y) => {
      const split = doc.splitTextToSize(String(text || ""), maxLineWidth)
      doc.text(split, x, y)
      return split.length * lineHeight
    }

    const formatResponse = (response) => {
      const { question_type, yes_no_answer, text_answer, sub_question_responses, option_responses } = response
      switch (question_type) {
        case "yes_no":
        case "conditional":
          return [yes_no_answer ? "Yes" : "No"]
        case "options":
        case "describe":
          if (option_responses?.length > 0) return option_responses.map(opt => opt.option_text)
          return [text_answer || "N/A"]
        case "quantity":
          if (option_responses?.length > 0) {
            return option_responses.map(opt => `${opt.option_text} — Qty: ${opt.quantity}`)
          }
          return ["N/A"]
        case "multiple_yes_no":
          if (sub_question_responses?.length > 0) {
            return sub_question_responses.map(sub => `${sub.sub_question_text}: ${sub.yes_no_answer}`)
          }
          return ["N/A"]
        default:
          return [text_answer || "N/A"]
      }
    }

    const getBase64FromUrl = async (url) => {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }

    // ------------------------
    // Logo + Header
    // ------------------------
    const logoBase64 = await getBase64FromUrl(
      "https://storage.googleapis.com/msgsndr/b8qvo7VooP3JD3dIZU42/media/683efc8fd5817643ff8194f0.jpeg"
    )
    const logoSize = 30
    doc.addImage(logoBase64, "JPEG", margin, yPosition, logoSize, logoSize)
    const textOffsetY = yPosition + logoSize / 2 - 5

    doc.setFontSize(18)
    doc.setFont(undefined, "bold")
    doc.text("TruShine Window Cleaning", margin + logoSize + 10, textOffsetY)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text("Professional Cleaning Services", margin + logoSize + 10, textOffsetY + 8)

    yPosition += logoSize + 15

    doc.setDrawColor(colors.black)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 15

    doc.setFontSize(16)
    doc.setFont(undefined, "bold")
    doc.text("SERVICE QUOTE", margin, yPosition)

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(`Quote #: ${quote.id}`, pageWidth - margin - 60, yPosition - 5)
    doc.text(`Date: ${new Date(quote.created_at).toLocaleDateString()}`, pageWidth - margin - 60, yPosition + 3)
    yPosition += 20

    // ------------------------
    // Customer Info
    // ------------------------
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("CUSTOMER INFORMATION", margin, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")
    doc.text(`Name: ${contact?.first_name || ""} ${contact?.last_name || ""}`, margin, yPosition)
    yPosition += 6
    doc.text(`Email: ${contact?.email || "N/A"}`, margin, yPosition)
    yPosition += 6
    doc.text(`Phone: ${contact?.phone || "N/A"}`, margin, yPosition)
    yPosition += 6
    doc.text(`Property Size: ${house_sqft || "N/A"} sq ft`, margin, yPosition)
    yPosition += 6

    if (address) {
      const fullAddress = `${address.name || ""}, ${address.street_address || ""}, ${address.city || ""}, ${address.state || ""} ${address.postal_code || ""}`
      yPosition += addWrappedText(`Address: ${fullAddress}`, margin, yPosition) + 3
    }

    yPosition += 10

    // ------------------------
    // Scheduled Service
    // ------------------------
    if (quote_schedule?.is_submitted && quote_schedule?.scheduled_date) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("SCHEDULED SERVICE", margin, yPosition)
      yPosition += 10

      const scheduledDate = new Date(quote_schedule.scheduled_date)
      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      doc.text(
        `Date: ${scheduledDate.toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        margin,
        yPosition
      )
      yPosition += 6
      doc.text(
        `Time: ${scheduledDate.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`,
        margin,
        yPosition
      )
      yPosition += 15
    }

    // ------------------------
    // Service Selections
    // ------------------------
    if (service_selections?.length > 0) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("SERVICES", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.text("Description", margin, yPosition)
      doc.text("Price", pageWidth - margin - 40, yPosition)
      yPosition += 8
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
      yPosition += 5
      doc.setFont(undefined, "normal")

      service_selections.forEach((selection, index) => {
        checkPageBreak(2)
        doc.text(selection.service_details?.name || "Service", margin, yPosition)
        doc.text(formatPrice(selection.final_total_price), pageWidth - margin - 40, yPosition)
        yPosition += 6

        if (selection.service_details?.description) {
          yPosition += addWrappedText(`Description: ${selection.service_details.description}`, margin + 5, yPosition)
        }

        if (selection.selected_package_details) {
          doc.text(`Package: ${selection.selected_package_details.name}`, margin + 5, yPosition)
          yPosition += 6
        }

        if (selection.question_responses?.length > 0) {
          doc.text("Responses:", margin + 5, yPosition)
          yPosition += 6
          selection.question_responses.forEach((response) => {
            checkPageBreak(2)
            const answers = formatResponse(response)
            doc.text(`• ${response.question_text}:`, margin + 10, yPosition)
            yPosition += 6
            answers.forEach(ans => {
              yPosition += addWrappedText(`   - ${ans}`, margin + 15, yPosition)
            })
            yPosition += 3
          })
        }

        yPosition += 5
      })
    }

    // ------------------------
    // Custom Services
    // ------------------------
    if (custom_products?.length > 0) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("ADDITIONAL SERVICES", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.text("Description", margin, yPosition)
      doc.text("Price", pageWidth - margin - 40, yPosition)
      yPosition += 8
      doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2)
      yPosition += 5
      doc.setFont(undefined, "normal")

      custom_products.forEach((product) => {
        checkPageBreak(2)
        doc.text(product.product_name, margin, yPosition)
        doc.text(formatPrice(product.price), pageWidth - margin - 40, yPosition)
        yPosition += 6
        if (product.description) {
          yPosition += addWrappedText(product.description, margin + 5, yPosition)
        }
      })
      yPosition += 10
    }

    // ------------------------
    // Pricing Summary
    // ------------------------
    doc.setFontSize(12)
    doc.setFont(undefined, "bold")
    doc.text("PRICING SUMMARY", margin, yPosition)
    yPosition += 10

    // Calculate all values like the web page does
    const totalServicePrice = service_selections?.reduce((sum, s) => sum + Number(s.final_total_price || 0), 0) || 0
    const customServiceTotal = custom_products?.reduce((sum, p) => sum + Number(p.price || 0), 0) || 0
    const subtotal = totalServicePrice
    const adjustment = subtotal < (globalPriceData?.base_price || 0) ? (globalPriceData?.base_price || 0) - subtotal : 0
    const final = subtotal + adjustment
    const taxRate = 0.0825 // 8.25% tax
    const taxAmount = final * taxRate
    const finalWithTax = final + taxAmount

    doc.setFontSize(10)
    doc.setFont(undefined, "normal")

    // Individual service prices
    if (service_selections?.length > 0) {
      service_selections.forEach((service) => {
        checkPageBreak(1)
        doc.text(service.service_details?.name || "Service", margin, yPosition)
        doc.text(formatPrice(service.final_total_price), pageWidth - margin - 40, yPosition)
        yPosition += 6
      })
    }

    // Custom Services (if any)
    if (custom_products?.length > 0 && Number.parseFloat(customServiceTotal) > 0) {
      checkPageBreak(1)
      doc.text("Custom Services", margin, yPosition)
      doc.text(formatPrice(customServiceTotal), pageWidth - margin - 40, yPosition)
      yPosition += 6
    }

    // Adjustments
    checkPageBreak(1)
    doc.text("Adjustments", margin, yPosition)
    doc.text(formatPrice(adjustment), pageWidth - margin - 40, yPosition)
    yPosition += 6

    // Tax
    checkPageBreak(1)
    doc.text("Tax (8.25%)", margin, yPosition)
    doc.text(formatPrice(taxAmount), pageWidth - margin - 40, yPosition)
    yPosition += 6

    // Add note if minimum base price applies
    if (subtotal < (globalPriceData?.base_price || 0)) {
      checkPageBreak(2)
      yPosition += 3
      doc.setFontSize(9)
      doc.setTextColor("#dc2626") // Red color for the note
      doc.text(`Note: Minimum base price is ${formatPrice(globalPriceData?.base_price || 0)}`, margin, yPosition)
      yPosition += 6
      doc.setFontSize(10)
      doc.setTextColor("#000000") // Reset to black
    }

    // Separator line
    yPosition += 3
    doc.setDrawColor("#000000")
    doc.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Final Total
    doc.setFont(undefined, "bold")
    doc.text("Final Total", margin, yPosition)
    doc.text(formatPrice(finalWithTax), pageWidth - margin - 40, yPosition)

    // Tax included note
    yPosition += 6
    doc.setFontSize(9)
    doc.setFont(undefined, "normal")
    doc.setTextColor("#666666")
    doc.text("Tax included", pageWidth - margin - 40, yPosition)

    // Reset formatting
    doc.setFontSize(10)
    doc.setTextColor("#000000")
    yPosition += 15

    // ------------------------
    // Additional Notes
    // ------------------------
    if (additional_data?.additional_notes) {
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("NOTES", margin, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setFont(undefined, "normal")
      yPosition += addWrappedText(additional_data.additional_notes, margin, yPosition) + 3
    }

    // ------------------------
    // Signature
    // ------------------------
    if (additional_data?.signature) {
      checkPageBreak(6)
      doc.setFontSize(12)
      doc.setFont(undefined, "bold")
      doc.text("CUSTOMER SIGNATURE", margin, yPosition)
      yPosition += 5

      try {
        doc.addImage(`data:image/png;base64,${additional_data.signature}`, "PNG", margin, yPosition, 60, 20)
        yPosition += 15
      } catch (e) {
        doc.setFontSize(10)
        doc.setFont(undefined, "normal")
        doc.text("Digital signature on file", margin, yPosition)
        yPosition += 10
      }
      yPosition += 10
      doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition)
      yPosition += 15
    }

    // // ------------------------
    // // Terms
    // // ------------------------
    // checkPageBreak(6)
    // doc.setFontSize(9)
    // doc.setFont(undefined, "normal")
    // doc.setTextColor(colors.gray)
    // yPosition += 10
    // doc.text("Terms: This quote is valid for 30 days. Payment due upon completion.", margin, yPosition)
    // yPosition += 4
    // doc.text("Weather conditions may affect scheduling. Additional charges may apply for unlisted services.", margin, yPosition)

    const timestamp = new Date().toISOString().split("T")[0]
    doc.save(`TruShine-Quote-${quote.id}-${timestamp}.pdf`)
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    alert("Failed to generate PDF. Please try again.")
  } finally {
    setIsGeneratingPDF(false)
  }
}
