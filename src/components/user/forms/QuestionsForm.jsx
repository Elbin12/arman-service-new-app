"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  TextField,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from "@mui/material"
import { ExpandMore } from "@mui/icons-material"
import { useGetServiceQuestionsQuery } from "../../../store/api/user/quoteApi"

export const QuestionsForm = ({ data, onUpdate }) => {
  const [allServiceQuestions, setAllServiceQuestions] = useState([])
  const [loadingServices, setLoadingServices] = useState([])
  const [forceRefresh, setForceRefresh] = useState(0)
  const [expandedService, setExpandedService] = useState(null)

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
    if (selectedServices.length > 0) {
      setExpandedService(selectedServices[0].id)
    }
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
    console.log('Answer change:', { serviceId, questionId, answer, subQuestionId, optionId })
    
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
    console.log('Quantity change:', { serviceId, questionId, optionId, quantity })
    
    const key = `${serviceId}_${questionId}_${optionId}_quantity`
    onUpdate({
      questionAnswers: {
        ...data.questionAnswers,
        [key]: quantity,
      },
    })
  }

  const getAllQuestionsFlattened = (questions) => {
    const flattened = []
    
    const processQuestion = (question) => {
      flattened.push(question)
      if (question.child_questions && question.child_questions.length > 0) {
        question.child_questions.forEach(childQuestion => {
          processQuestion(childQuestion)
        })
      }
    }

    questions.forEach(question => {
      processQuestion(question)
    })

    return flattened
  }

  const shouldShowQuestion = (question, serviceId) => {
    if (!question.parent_question || !question.condition_answer) {
      return true
    }

    const parentKey = `${serviceId}_${question.parent_question}`
    const parentAnswer = data.questionAnswers?.[parentKey]
    return parentAnswer === question.condition_answer
  }

  const renderQuestion = (question, serviceId) => {
    return (
      <Box key={question.id} sx={{ mb: 3 }}>
        <Box
          sx={{
            backgroundColor: '#d9edf7',
            padding: '12px 20px',
            borderRadius: '8px',
            mb: 2
          }}
        >
          <Typography 
            sx={{ 
              color: '#2c2c6c',
              fontSize: '22px',
              fontWeight: 400,
              lineHeight: 1.4
            }}
          >
          {question.text}
          </Typography>
        </Box>
        
        <Box sx={{ pl: 2 }}>
          {renderQuestionContent(question, serviceId)}
        </Box>
      </Box>
    )
  }

  const renderQuestionContent = (question, serviceId) => {
    const questionKey = `${serviceId}_${question.id}`

    switch (question.type) {
      case "yes_no":
      case "conditional":
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={data.questionAnswers?.[questionKey] || ""}
              onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value)}
              sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}
            >
              <FormControlLabel 
                value="yes" 
                control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                label="Yes" 
              />
              <FormControlLabel 
                value="no" 
                control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                label="No" 
              />
            </RadioGroup>
          </FormControl>
        )

      case "describe":
      case "options":
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={data.questionAnswers?.[questionKey] || ""}
              onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value)}
              sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              {question.options?.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />}
                  label={option.text}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )

      case "quantity":
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {question.options?.map((option) => {
              const optionKey = `${serviceId}_${question.id}_${option.id}`
              const quantityKey = `${serviceId}_${question.id}_${option.id}_quantity`
              const isSelected = Boolean(data.questionAnswers?.[optionKey])
              const quantity = data.questionAnswers?.[quantityKey] || 1

              return (
                <Box 
                  key={option.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    padding: '12px',
                    border: isSelected ? '1px solid #779cd1' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#f8fbff' : 'white'
                  }}
                >
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
                          }
                          onUpdate({ questionAnswers: updatedAnswers })
                        }}
                        sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }}
                      />
                    }
                    label={option.text}
                  />
                  
                  {isSelected && option.allow_quantity && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                      <TextField
                        type="number"
                        size="small"
                        value={data.questionAnswers?.[quantityKey] ?? ""}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === "") {
                            handleQuantityChange(serviceId, question.id, option.id, "")
                            return
                          }
                          const newQuantity = Math.min(
                            Math.max(1, Number(value)),
                            option.max_quantity
                          )
                          handleQuantityChange(serviceId, question.id, option.id, newQuantity)
                        }}
                        onBlur={(e) => {
                          // If left empty, reset to minimum (1)
                          if (e.target.value === "") {
                            handleQuantityChange(serviceId, question.id, option.id, 1)
                          }
                        }}
                        inputProps={{
                          min: 1,
                          max: option.max_quantity,
                        }}
                        sx={{ width: 80 }}
                      />

                      <Typography variant="caption" sx={{ color: '#666' }}>
                        (Max: {option.max_quantity})
                      </Typography>
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
        )

      case "multiple_yes_no":
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {question.sub_questions?.map((subQuestion) => {
              const subQuestionKey = `${serviceId}_${question.id}_${subQuestion.id}`
              
              return (
                <Box key={subQuestion.id}>
                  <Typography sx={{ fontSize: '15px', mb: 1, color: '#555', fontWeight: 500 }}>
                    {subQuestion.text}
                  </Typography>
                  <FormControl component="fieldset" sx={{ ml: 2 }}>
                    <RadioGroup
                      value={data.questionAnswers?.[subQuestionKey] || ""}
                      onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value, subQuestion.id)}
                      sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}
                    >
                      <FormControlLabel 
                        value="yes" 
                        control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                        label="Yes" 
                      />
                      <FormControlLabel 
                        value="no" 
                        control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                        label="No" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
              )
            })}
          </Box>
        )

      default:
        return <Alert severity="warning">Unsupported question type: {question.type}</Alert>
    }
  }

  const handleAccordionChange = (serviceId) => (event, isExpanded) => {
    setExpandedService(isExpanded ? serviceId : null)
  }

  // Show loading state
  if (serviceQueries.some((query) => query.isLoading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress sx={{ color: '#023c8f' }} />
        <Typography sx={{ ml: 2 }}>Loading questions...</Typography>
      </Box>
    )
  }

  // Show error state
  if (serviceQueries.some((query) => query.isError)) {
    return (
      <Alert 
        severity="error" 
        action={
          <button 
            onClick={handleRefresh} 
            style={{ 
              padding: "8px 16px", 
              backgroundColor: '#023c8f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        }
      >
        Failed to load questions. Please try again.
      </Alert>
    )
  }

  // Show no questions state
  if (allServiceQuestions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Service Questions
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No questions available for the selected services.
        </Typography>
        <button 
          onClick={handleRefresh} 
          style={{ 
            padding: "10px 20px",
            backgroundColor: '#023c8f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Refresh Questions
        </button>
      </Box>
    )
  }

  // Debug log
  console.log('Current question answers:', data.questionAnswers)

  return (
    <Box>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 1, 
          fontWeight: 300, 
          color: '#023c8f',
          textAlign: 'center'
        }}
      >
        Service Questions
      </Typography>
      
      <Typography 
        sx={{ 
          mb: 4, 
          color: '#666', 
          textAlign: 'center'
        }}
      >
        Please answer the questions for each service
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {allServiceQuestions.map((serviceData) => {
          const hasQuestions = serviceData.questions.length > 0
          const isExpanded = expandedService === serviceData.service.id

          return (
            <Accordion 
              key={serviceData.service.id}
              expanded={isExpanded}
              onChange={handleAccordionChange(serviceData.service.id)}
              sx={{
                border: '1px solid #ddd',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                boxShadow: 'none'
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                sx={{
                  backgroundColor: '#023c8f',
                  color: 'white',
                  borderRadius: '8px',
                  minHeight: 48,
                  '&.Mui-expanded': {
                    minHeight: 48,
                    borderRadius: '8px 8px 0 0'
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                  },
                  '& .MuiAccordionSummary-content.Mui-expanded': {
                    margin: 0,
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {serviceData.service.name}
                </Typography>
              </AccordionSummary>
              
              <AccordionDetails sx={{ p: 2 }}>
                {serviceData.service.description && (
                  <Typography sx={{ mb: 2, color: '#666', fontSize: '14px' }}>
                    {serviceData.service.description}
                  </Typography>
                )}

                {!hasQuestions ? (
                  <Typography sx={{ color: '#666', fontStyle: "italic" }}>
                    No additional questions for this service.
                  </Typography>
                ) : (
                  <Box>
                    {getAllQuestionsFlattened(serviceData.questions)
                      .filter(question => shouldShowQuestion(question, serviceData.service.id))
                      .map((question) => renderQuestion(question, serviceData.service.id))
                    }
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
    </Box>
  )
}

export default QuestionsForm