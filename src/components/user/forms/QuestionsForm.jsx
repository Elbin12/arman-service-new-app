"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  TextField,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Divider,
} from "@mui/material"
import { ExpandMore } from "@mui/icons-material"
import { useGetServiceQuestionsQuery } from "../../../store/api/user/quoteApi"

export const QuestionsForm = ({ data, onUpdate }) => {
  const [allServiceQuestions, setAllServiceQuestions] = useState([])
  const [loadingServices, setLoadingServices] = useState([])
  const [forceRefresh, setForceRefresh] = useState(0)

  // Get selected services from data.selectedServices
  const selectedServices = data?.selectedServices || []

  // Create queries for each selected service with forceRefresh to ensure re-fetching
  const serviceQueries = selectedServices.map((service) =>
    useGetServiceQuestionsQuery(service.id, {
      skip: !service.id,
      // Force refetch when component mounts or forceRefresh changes
      refetchOnMountOrArgChange: true,
      // Optionally, you can also add:
      // refetchOnFocus: true,
      // refetchOnReconnect: true,
    }),
  )

  // Force refresh when component mounts or selectedServices change
  useEffect(() => {
    setForceRefresh((prev) => prev + 1)
    setAllServiceQuestions([]) // Clear previous data
  }, [selectedServices.map((s) => s.id).join(",")])

  // Process all service questions
  useEffect(() => {
    const processServiceQuestions = () => {
      const processedServices = []
      let hasLoading = false
      let hasError = false

      serviceQueries.forEach((query, index) => {
        const service = selectedServices[index]

        if (query.isLoading) {
          hasLoading = true
          if (!loadingServices.includes(service.id)) {
            setLoadingServices((prev) => [...prev, service.id])
          }
        } else {
          setLoadingServices((prev) => prev.filter((id) => id !== service.id))
        }

        if (query.isError) {
          hasError = true
          return
        }

        if (query.data && !query.isLoading) {
          const serviceData = query.data

          const normalizedQuestions = Array.from(serviceData.questions || [])
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((q) => normalizeQuestion(q))

          processedServices.push({
            service: serviceData.service,
            questions: normalizedQuestions,
          })
        }
      })

      if (!hasLoading && !hasError && processedServices.length > 0) {
        setAllServiceQuestions(processedServices)
      }
    }

    processServiceQuestions()
  }, [
    serviceQueries.map((q) => q.data),
    serviceQueries.map((q) => q.isLoading),
    serviceQueries.map((q) => q.isError),
    forceRefresh,
  ])

  // Add a manual refresh function
  const handleRefresh = () => {
    setForceRefresh((prev) => prev + 1)
    // Manually refetch all queries
    serviceQueries.forEach((query) => {
      if (query.refetch) {
        query.refetch()
      }
    })
  }

  const normalizeQuestion = (question) => {
    const normalized = {
      id: question.id,
      text: question.question_text,
      type: question.question_type,
      order: question.order,
      parent_question: question.parent_question,
      condition_answer: question.condition_answer,
      condition_option: question.condition_option,
      options: [],
      sub_questions: [],
      child_questions: [],
    }

    // Process options for describe, quantity, options types
    if (["describe", "quantity", "options"].includes(question.question_type) && question.options) {
      normalized.options = Array.from(question.options)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((opt) => ({
          id: opt.id,
          text: opt.option_text,
          allow_quantity: opt.allow_quantity || false,
          max_quantity: opt.max_quantity || 1,
        }))
    }

    // Process sub-questions for multiple_yes_no type
    if (question.question_type === "multiple_yes_no" && question.sub_questions) {
      normalized.sub_questions = Array.from(question.sub_questions)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((subQ) => ({
          id: subQ.id,
          text: subQ.sub_question_text,
          order: subQ.order,
        }))
    }

    // Process child questions for conditional types
    if (question.child_questions && question.child_questions.length > 0) {
      normalized.child_questions = question.child_questions.map((child) => normalizeQuestion(child))
    }

    return normalized
  }

  const handleAnswerChange = (serviceId, questionId, answer, subQuestionId = null, optionId = null) => {
    const key = subQuestionId
      ? `${serviceId}_${questionId}_${subQuestionId}`
      : optionId
        ? `${serviceId}_${questionId}_${optionId}`
        : `${serviceId}_${questionId}`

    onUpdate({
      questionAnswers: {
        ...data.questionAnswers,
        [key]: answer,
      },
    })
  }

  const handleQuantityChange = (serviceId, questionId, optionId, quantity) => {
    const key = `${serviceId}_${questionId}_${optionId}_quantity`
    onUpdate({
      questionAnswers: {
        ...data.questionAnswers,
        [key]: quantity,
      },
    })
  }

  const renderQuestion = (question, serviceId, parentQuestion = null) => {
    const questionKey = `${serviceId}_${question.id}`

    // Check if this is a conditional child question that should be shown
    if (question.parent_question && question.condition_answer) {
      const parentKey = `${serviceId}_${question.parent_question}`
      const parentAnswer = data.questionAnswers?.[parentKey]

      if (parentAnswer !== question.condition_answer) {
        return null // Don't show conditional question if condition not met
      }
    }

    return (
      <Card key={question.id} sx={{ mb: 2, borderRadius: 2 }}>
        <Box
          sx={{
            background: parentQuestion
              ? "linear-gradient(90deg,#f97316,#fb923c)"
              : "linear-gradient(90deg,#9333ea,#c084fc)",
            color: "white",
            px: 2,
            py: 1,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {parentQuestion ? "↳ " : ""}
            {question.text}
          </Typography>
          {/* <Chip
            label={question.type}
            size="small"
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              color: "white",
              fontSize: "11px",
            }}
          /> */}
        </Box>
        <CardContent>
          {renderQuestionContent(question, serviceId, parentQuestion)}

          {/* Render child questions if conditions are met */}
          {question.child_questions &&
            question.child_questions.map((childQuestion) => renderQuestion(childQuestion, serviceId, question))}
        </CardContent>
      </Card>
    )
  }

  const renderQuestionContent = (question, serviceId) => {
    const questionKey = `${serviceId}_${question.id}`

    switch (question.type) {
      case "yes_no":
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={data.questionAnswers?.[questionKey] || ""}
              onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value)}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </Box>
            </RadioGroup>
          </FormControl>
        )

      case "describe":
      case "options":
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={data.questionAnswers?.[questionKey] || ""}
              onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value)}
            >
              {question.options?.map((option) => (
                <FormControlLabel key={option.id} value={option.id} control={<Radio />} label={option.text} />
              ))}
            </RadioGroup>
          </FormControl>
        )

      case "quantity":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {question.options?.map((option) => {
              const optionKey = `${serviceId}_${question.id}_${option.id}`
              const quantityKey = `${serviceId}_${question.id}_${option.id}_quantity`
              const isSelected = Boolean(data.questionAnswers?.[optionKey])
              const quantity = data.questionAnswers?.[quantityKey] || 1

              return (
                <Box key={option.id} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          const updatedAnswers = { ...data.questionAnswers }
                          if (e.target.checked) {
                            updatedAnswers[optionKey] = "selected"
                            if (option.allow_quantity) {
                              updatedAnswers[quantityKey] = quantity || 1
                            }
                          } else {
                            delete updatedAnswers[optionKey]
                            delete updatedAnswers[quantityKey]
                            // handleQuantityChange(serviceId, question.id, option.id, 1)
                          }
                          onUpdate({ questionAnswers: updatedAnswers })
                        }}
                      />
                    }
                    label={option.text}
                  />
                  {isSelected && option.allow_quantity && (
                    <TextField
                      type="number"
                      size="small"
                      label="Quantity"
                      value={quantity}
                      onChange={(e) => {
                        const newQuantity = Math.min(
                          Math.max(1, Number.parseInt(e.target.value) || 1),
                          option.max_quantity,
                        )
                        handleQuantityChange(serviceId, question.id, option.id, newQuantity)
                      }}
                      inputProps={{
                        min: 1,
                        max: option.max_quantity,
                      }}
                      sx={{ width: 100 }}
                    />
                  )}
                  {option.allow_quantity && (
                    <Typography variant="caption" color="text.secondary">
                      Max: {option.max_quantity}
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        )

      case "multiple_yes_no":
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {question.sub_questions?.map((subQuestion) => {
              const subQuestionKey = `${serviceId}_${question.id}_${subQuestion.id}`
              return (
                <FormControl key={subQuestion.id} component="fieldset">
                  <FormLabel component="legend" sx={{ fontSize: "14px", mb: 1 }}>
                    {subQuestion.text}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={data.questionAnswers?.[subQuestionKey] || ""}
                    onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value, subQuestion.id)}
                  >
                    <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                    <FormControlLabel value="no" control={<Radio />} label="No" />
                  </RadioGroup>
                </FormControl>
              )
            })}
          </Box>
        )

      case "conditional":
        return (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={data.questionAnswers?.[questionKey] || ""}
              onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value)}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </Box>
            </RadioGroup>
          </FormControl>
        )

      default:
        return <Alert severity="warning">Unsupported question type: {question.type}</Alert>
    }
  }

  // Show loading state
  if (serviceQueries.some((query) => query.isLoading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading questions...</Typography>
      </Box>
    )
  }

  // Show error state
  if (serviceQueries.some((query) => query.isError)) {
    return (
      <Box>
        <Typography color="error">Failed to load questions for some services. Please try again.</Typography>
        <button onClick={handleRefresh} style={{ marginTop: "10px", padding: "8px 16px" }}>
          Retry Loading Questions
        </button>
      </Box>
    )
  }

  // Show no questions state
  if (allServiceQuestions.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Answer Questions
        </Typography>
        <Typography color="text.secondary">No questions available for the selected services.</Typography>
        <button onClick={handleRefresh} style={{ marginTop: "10px", padding: "8px 16px" }}>
          Refresh Questions
        </button>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Answer Questions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please answer the following questions for your selected services.
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {allServiceQuestions.map((serviceData, serviceIndex) => {
          const hasQuestions = serviceData.questions.length > 0

          return (
            <Box key={serviceData.service.id}>
              <Accordion defaultExpanded={serviceIndex === 0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {serviceData.service.name}
                    </Typography>
                    <Chip
                      label={`${serviceData.questions.length} question${serviceData.questions.length !== 1 ? "s" : ""}`}
                      size="small"
                      color={hasQuestions ? "primary" : "default"}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {serviceData.service.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {serviceData.service.description}
                    </Typography>
                  )}

                  {!hasQuestions ? (
                    <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                      No additional questions for this service.
                    </Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {serviceData.questions
                        .filter((question) => !question.parent_question) // Only show top-level questions
                        .map((question, index) => (
                          <Box key={question.id}>
                            {index > 0 && <Divider sx={{ my: 2 }} />}
                            {renderQuestion(question, serviceData.service.id)}
                          </Box>
                        ))}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export default QuestionsForm
