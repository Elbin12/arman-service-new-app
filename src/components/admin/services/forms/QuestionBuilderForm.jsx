"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from "@mui/material"
import { Add, Block, Delete, Edit, Restore } from "@mui/icons-material"
import {
  useCreateQuestionMutation,
  useDeleteQuestionMutation,
  useUpdateQuestionMutation,
  useUpdateQuestionStatusMutation,
} from "../../../../store/api/questionsApi"
import {
  useCreateQuestionOptionMutation,
  useDeleteQuestionOptionMutation,
  useUpdateQuestionOptionMutation,
} from "../../../../store/api/questionOptionsApi"
import {
  useCreateQuestionSubQuestionMutation,
  useDeleteQuestionSubQuestionMutation,
  useUpdateQuestionSubQuestionMutation,
} from "../../../../store/api/questionSubQuestionsApi"

const QUESTION_TYPES = [
  { value: "describe", label: "Multiple Choice (Describe)" },
  { value: "multiple_yes_no", label: "Multiple Yes/No Questions" },
  { value: "quantity", label: "Quantity Selection" },
  { value: "yes_no", label: "Simple Yes/No" },
  { value: "conditional", label: "Conditional (If Yes)" },
]

const isOptionType = (type) => ["describe", "quantity"].includes(type)
const isSubQuestionType = (type) => type === "multiple_yes_no"

const QuestionBuilderForm = ({ data, onUpdate }) => {
  const [questions, setQuestions] = useState(data.questions || [])
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    question_type: "describe",
    order: 1,
    options: [],
    sub_questions: [],
    parent_question: null,
    condition_answer: null,
    conditional_child: null, // for conditional type
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [optionInputs, setOptionInputs] = useState({})
  const [subQuestionInputs, setSubQuestionInputs] = useState({})

  const [editingOptionId, setEditingOptionId] = useState(null)
  const [editingOptionText, setEditingOptionText] = useState("")

  const [editingSubQuestionId, setEditingSubQuestionId] = useState(null)
  const [editingSubQuestionText, setEditingSubQuestionText] = useState("")

  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editingQuestionText, setEditingQuestionText] = useState("")

  const [openConfirmModal, setOpenConfirmModal] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  const [createQuestion] = useCreateQuestionMutation()
  const [createQuestionOption] = useCreateQuestionOptionMutation()
  const [updateQuestionOption] = useUpdateQuestionOptionMutation()
  const [deleteQuestionOption] = useDeleteQuestionOptionMutation()
  const [createQuestionSubQuestion] = useCreateQuestionSubQuestionMutation()
  const [updateQuestionSubQuestion] = useUpdateQuestionSubQuestionMutation()
  const [deleteQuestionSubQuestion] = useDeleteQuestionSubQuestionMutation()
  const [updateQuestion] = useUpdateQuestionMutation()
  const [deleteQuestion] = useDeleteQuestionMutation()
  const [updateQuestionStatus] = useUpdateQuestionStatusMutation()

  useEffect(() => {
    setQuestions(data.questions || [])
  }, [data.questions])

  const validateQuestion = (q = newQuestion) => {
    const newErrors = {}
    if (!q.question_text || q.question_text.trim().length < 5) {
      newErrors.question_text = "Question text must be at least 5 characters"
    }
    if (isOptionType(q.question_type)) {
      if (!q.options || q.options.length === 0) {
        newErrors.options = "At least one option is required for this question type"
      }
    }
    if (isSubQuestionType(q.question_type)) {
      if (!q.sub_questions || q.sub_questions.length === 0) {
        newErrors.sub_questions = "At least one sub-question is required for multiple yes/no type"
      }
    }
    if (q.question_type === "conditional") {
      if (q.conditional_child) {
        if (!q.conditional_child.question_text || q.conditional_child.question_text.trim().length < 5) {
          newErrors.conditional_child = "Child question must have valid text"
        }
        if (isOptionType(q.conditional_child.question_type)) {
          if (!q.conditional_child.options || q.conditional_child.options.length === 0) {
            newErrors.conditional_child_options = "Child question needs at least one option"
          }
        }
        if (isSubQuestionType(q.conditional_child.question_type)) {
          if (!q.conditional_child.sub_questions || q.conditional_child.sub_questions.length === 0) {
            newErrors.conditional_child_sub_questions = "Child question needs at least one sub-question"
          }
        }
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddQuestion = async () => {
    if (!validateQuestion()) return

    setIsLoading(true)
    try {
      const questionPayload = {
        service: data.id,
        question_text: newQuestion.question_text.trim(),
        question_type: newQuestion.question_type,
        order: questions.length + 1,
      }

      // Add conditional fields if it's a conditional question
      if (newQuestion.parent_question) {
        questionPayload.parent_question = newQuestion.parent_question
        questionPayload.condition_answer = newQuestion.condition_answer
      }

      // Add options for describe/quantity types
      if (isOptionType(newQuestion.question_type) && newQuestion.options.length > 0) {
        questionPayload.options = newQuestion.options.map((opt, idx) => ({
          option_text: opt.option_text || opt,
          order: idx + 1,
          ...(newQuestion.question_type === "quantity" && {
            allow_quantity: opt.allow_quantity || false,
            max_quantity: opt.max_quantity || 1,
          }),
        }))
      }

      // Add sub-questions for multiple_yes_no type
      if (isSubQuestionType(newQuestion.question_type) && newQuestion.sub_questions.length > 0) {
        questionPayload.sub_questions = newQuestion.sub_questions.map((subQ, idx) => ({
          sub_question_text: subQ.sub_question_text || subQ,
          order: idx + 1,
        }))
      }

      const questionResult = await createQuestion(questionPayload).unwrap()

      // Handle conditional child if present
      let updatedQuestion = { ...questionResult }
      if (newQuestion.question_type === "conditional" && newQuestion.conditional_child) {
        const child = newQuestion.conditional_child
        try {
          // Create child question with reference to parent
          const childPayload = {
            service: data.id,
            question_text: child.question_text.trim(),
            question_type: child.question_type,
            order: 1, // arbitrary
            parent_question: questionResult.id, // adapt per API
            condition_answer: "yes", // adapt if your backend uses different
          }

          // Add child options if needed
          if (isOptionType(child.question_type) && child.options && child.options.length > 0) {
            childPayload.options = child.options.map((opt, idx) => ({
              option_text: opt.option_text || opt,
              order: idx + 1,
              ...(child.question_type === "quantity" && {
                allow_quantity: opt.allow_quantity || false,
                max_quantity: opt.max_quantity || 1,
              }),
            }))
          }

          // Add child sub-questions if needed
          if (isSubQuestionType(child.question_type) && child.sub_questions && child.sub_questions.length > 0) {
            childPayload.sub_questions = child.sub_questions.map((subQ, idx) => ({
              sub_question_text: subQ.sub_question_text || subQ,
              order: idx + 1,
            }))
          }

          const childResult = await createQuestion(childPayload).unwrap()

          updatedQuestion = {
            ...updatedQuestion,
            child_questions: [childResult],
          }
        } catch (e) {
          console.error("Failed to create conditional child", e)
        }
      }

      const updatedQuestions = [...questions, updatedQuestion]
      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })

      // Reset dialog
      setQuestionDialogOpen(false)
      setNewQuestion({
        question_text: "",
        question_type: "describe",
        order: 1,
        options: [],
        sub_questions: [],
        parent_question: null,
        condition_answer: null,
        conditional_child: null,
      })
      setErrors({})
    } catch (error) {
      console.error("Failed to create question:", error)
      setErrors({
        general: error?.data?.message || error?.data?.detail || "Failed to create question. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddOptionToNewQuestion = () => {
    const optionText = optionInputs["new"] || ""
    if (!optionText.trim()) return

    const newOption = {
      option_text: optionText.trim(),
      allow_quantity: newQuestion.question_type === "quantity",
      max_quantity: 1,
      tempId: Date.now(),
    }

    setNewQuestion((prev) => ({
      ...prev,
      options: [...prev.options, newOption],
    }))
    setOptionInputs((prev) => ({ ...prev, new: "" }))
  }

  const handleAddSubQuestionToNew = () => {
    const subQuestionText = subQuestionInputs["new"] || ""
    if (!subQuestionText.trim()) return

    const newSubQuestion = {
      sub_question_text: subQuestionText.trim(),
      tempId: Date.now(),
    }

    setNewQuestion((prev) => ({
      ...prev,
      sub_questions: [...prev.sub_questions, newSubQuestion],
    }))
    setSubQuestionInputs((prev) => ({ ...prev, new: "" }))
  }

  const handleAddOptionToConditionalChild = () => {
    const optionText = optionInputs["conditional_child"] || ""
    if (!optionText.trim()) return

    const newOption = {
      option_text: optionText.trim(),
      allow_quantity: newQuestion.conditional_child?.question_type === "quantity",
      max_quantity: 1,
      tempId: Date.now(),
    }

    setNewQuestion((prev) => ({
      ...prev,
      conditional_child: {
        ...prev.conditional_child,
        options: [...(prev.conditional_child?.options || []), newOption],
      },
    }))
    setOptionInputs((prev) => ({ ...prev, conditional_child: "" }))
  }

  const handleAddSubQuestionToConditionalChild = () => {
    const subQuestionText = subQuestionInputs["conditional_child"] || ""
    if (!subQuestionText.trim()) return

    const newSubQuestion = {
      sub_question_text: subQuestionText.trim(),
      tempId: Date.now(),
    }

    setNewQuestion((prev) => ({
      ...prev,
      conditional_child: {
        ...prev.conditional_child,
        sub_questions: [...(prev.conditional_child?.sub_questions || []), newSubQuestion],
      },
    }))
    setSubQuestionInputs((prev) => ({ ...prev, conditional_child: "" }))
  }

  const handleRemoveOptionFromNew = (tempId) => {
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options.filter((opt) => opt.tempId !== tempId),
    }))
  }

  const handleRemoveSubQuestionFromNew = (tempId) => {
    setNewQuestion((prev) => ({
      ...prev,
      sub_questions: prev.sub_questions.filter((subQ) => subQ.tempId !== tempId),
    }))
  }

  const handleRemoveOptionFromConditionalChild = (tempId) => {
    setNewQuestion((prev) => ({
      ...prev,
      conditional_child: {
        ...prev.conditional_child,
        options: prev.conditional_child?.options?.filter((opt) => opt.tempId !== tempId) || [],
      },
    }))
  }

  const handleRemoveSubQuestionFromConditionalChild = (tempId) => {
    setNewQuestion((prev) => ({
      ...prev,
      conditional_child: {
        ...prev.conditional_child,
        sub_questions: prev.conditional_child?.sub_questions?.filter((subQ) => subQ.tempId !== tempId) || [],
      },
    }))
  }

  const handleAddOptionToQuestion = async (questionId, optionText, maxQty = 1, forChild = false, parentQuestionId = null) => {
    if (!optionText.trim()) return

    try {
      const payload = {
        question: questionId,
        question_id: questionId,
        option_text: optionText.trim(),
        order: 1,
      }
      
      // Add quantity-specific fields if it's a quantity question
      const currentQuestion = forChild 
        ? questions.find(q => q.id === parentQuestionId)?.child_questions?.find(child => child.id === questionId)
        : questions.find(q => q.id === questionId)
      
      if (currentQuestion?.question_type === "quantity") {
        payload.allow_quantity = true
        payload.max_quantity = parseInt(maxQty) || 1
      }
      
      const optionResult = await createQuestionOption(payload).unwrap()

      const updatedQuestions = questions.map((q) => {
        if (!forChild && q.id === questionId) {
          return { ...q, options: [...(q.options || []), optionResult] }
        }
        if (forChild && q.id === parentQuestionId) {
          return {
            ...q,
            child_questions: q.child_questions.map((child) =>
              child.id === questionId ? { ...child, options: [...(child.options || []), optionResult] } : child,
            ),
          }
        }
        return q
      })

      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })
    } catch (err) {
      console.error("Failed to add option", err)
    }
  }

  const handleDeleteOptionFromQuestion = async (questionId, optionId, isChild = false, parentQuestionId = null) => {
    try {
      await deleteQuestionOption(optionId).unwrap()

      const updatedQuestions = questions.map((q) => {
        if (!isChild && q.id === questionId) {
          return {
            ...q,
            options: q.options.filter((opt) => opt.id !== optionId),
          }
        }
        if (isChild && q.id === parentQuestionId) {
          return {
            ...q,
            child_questions: q.child_questions.map((child) =>
              child.id === questionId
                ? { ...child, options: child.options.filter((opt) => opt.id !== optionId) }
                : child,
            ),
          }
        }
        return q
      })

      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })
    } catch (err) {
      console.error("Failed to delete option:", err)
    }
  }

  const handleAddSubQuestionToQuestion = async (
    questionId,
    subQuestionText,
    forChild = false,
    parentQuestionId = null,
  ) => {
    if (!subQuestionText.trim()) return

    try {
      const payload = {
        question: questionId,
        parent_question: questionId,
        sub_question_text: subQuestionText.trim(),
        order: 1,
      }
      const subQuestionResult = await createQuestionSubQuestion(payload).unwrap()

      const updatedQuestions = questions.map((q) => {
        if (!forChild && q.id === questionId) {
          return { ...q, sub_questions: [...(q.sub_questions || []), subQuestionResult] }
        }
        if (forChild && q.id === parentQuestionId) {
          return {
            ...q,
            child_questions: q.child_questions.map((child) =>
              child.id === questionId
                ? { ...child, sub_questions: [...(child.sub_questions || []), subQuestionResult] }
                : child,
            ),
          }
        }
        return q
      })

      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })
    } catch (err) {
      console.error("Failed to add sub-question", err)
    }
  }

  const handleDeleteSubQuestionFromQuestion = async (
    questionId,
    subQuestionId,
    isChild = false,
    parentQuestionId = null,
  ) => {
    try {
      await deleteQuestionSubQuestion(subQuestionId).unwrap()

      const updatedQuestions = questions.map((q) => {
        if (!isChild && q.id === questionId) {
          return {
            ...q,
            sub_questions: q.sub_questions.filter((subQ) => subQ.id !== subQuestionId),
          }
        }
        if (isChild && q.id === parentQuestionId) {
          return {
            ...q,
            child_questions: q.child_questions.map((child) =>
              child.id === questionId
                ? { ...child, sub_questions: child.sub_questions.filter((subQ) => subQ.id !== subQuestionId) }
                : child,
            ),
          }
        }
        return q
      })

      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })
    } catch (err) {
      console.error("Failed to delete sub-question:", err)
    }
  }

  const handleToggleQuestionActive = async (id, currentStatus) => {
    try {
      await updateQuestionStatus({ id, is_active: !currentStatus }).unwrap()

      const updatedQuestions = questions.map((q) => (q.id === id ? { ...q, is_active: !currentStatus } : q))

      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })
    } catch (error) {
      console.error("Failed to toggle question active status:", error)
      setErrors({
        general: error?.data?.message || error?.data?.detail || "Failed to update question status. Please try again.",
      })
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await deleteQuestion(selectedQuestion?.id).unwrap()
      const updatedQuestions = questions.filter((q) => q.id !== selectedQuestion?.id)
      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })
      setOpenConfirmModal(false)
      setSelectedQuestion(null)
    } catch (error) {
      console.error("Failed to permanently delete question:", error)
      setErrors({
        general:
          error?.data?.message || error?.data?.detail || "Failed to delete question permanently. Please try again.",
      })
      setOpenConfirmModal(false)
    }
  }

  const confirmHardDelete = (question) => {
    setSelectedQuestion(question)
    setOpenConfirmModal(true)
  }

  const updateExistingQuestion = async (question) => {
    try {
      const payload = {
        id: question.id,
        question_text: question.question_text,
        question_type: question.question_type,
        order: question.order,
        service: data.id,
      }
      const updated = await updateQuestion(payload).unwrap()

      const updatedQuestions = questions.map((q) => (q.id === question.id ? { ...q, ...updated } : q))
      setQuestions(updatedQuestions)
      onUpdate({ questions: updatedQuestions })
    } catch (err) {
      console.error("Failed to update question:", err)
    }
  }

  const renderOptionList = (question, isChild = false, parentQuestionId = null) => {
    const options = isChild ? question?.options || [] : question?.options || []

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Options:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {options.map((option) => (
            <Box
              key={option.id || option.tempId || Math.random()}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                border: "1px solid #e0e0e0",
                padding: 0.5,
                borderRadius: 1,
              }}
            >
              {editingOptionId === option.id ? (
                <TextField
                  size="small"
                  value={editingOptionText}
                  onChange={(e) => setEditingOptionText(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && editingOptionText.trim()) {
                      try {
                        const result = await updateQuestionOption({
                          id: option.id,
                          option_text: editingOptionText.trim(),
                          question: question.id,
                        }).unwrap()

                        const updatedQuestions = questions.map((q) => {
                          if (!isChild && q.id === question.id) {
                            return {
                              ...q,
                              options: q.options.map((opt) => (opt.id === option.id ? result : opt)),
                            }
                          }
                          if (isChild && q.id === parentQuestionId) {
                            return {
                              ...q,
                              child_questions: q.child_questions.map((child) =>
                                child.id === question.id
                                  ? {
                                      ...child,
                                      options: child.options.map((opt) => (opt.id === option.id ? result : opt)),
                                    }
                                  : child,
                              ),
                            }
                          }
                          return q
                        })

                        setQuestions(updatedQuestions)
                        setEditingOptionId(null)
                      } catch (err) {
                        console.error("Failed to update option:", err)
                      }
                    } else if (e.key === "Escape") {
                      setEditingOptionId(null)
                    }
                  }}
                  onBlur={() => setEditingOptionId(null)}
                  autoFocus
                />
              ) : (
                <>
                  <Typography variant="body2">{option.option_text || option}</Typography>
                  {question.question_type === "quantity" && (
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "12px" }}>
                      (Max: {option.max_quantity || 1})
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingOptionId(option.id)
                        setEditingOptionText(option.option_text || "")
                      }}
                      sx={{ p: 0 }}
                    >
                      <Edit sx={{ fontSize: "14px", color: "#9CCA6D" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteOptionFromQuestion(question.id, option.id, isChild, parentQuestionId)}
                      sx={{ p: 0 }}
                    >
                      <Delete sx={{ fontSize: "14px", color: "#BE4B4B" }} />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>
          ))}
        </Box>

        {/* inline add */}
        <Box display="flex" gap={1} alignItems="center" mb={2} flexWrap="wrap">
          <TextField
            size="small"
            label="New Option"
            value={isChild ? optionInputs[`child_${question.id}`] || "" : optionInputs[question.id] || ""}
            onChange={(e) =>
              setOptionInputs((prev) => ({
                ...prev,
                [isChild ? `child_${question.id}` : question.id]: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (isChild) {
                  handleAddOptionToQuestion(
                    question.id,
                    optionInputs[`child_${question.id}`] || "",
                    optionInputs[`child_${question.id}_maxQty`] || 1,
                    true,
                    parentQuestionId,
                  )
                  setOptionInputs((prev) => ({ 
                    ...prev, 
                    [`child_${question.id}`]: "",
                    [`child_${question.id}_maxQty`]: ""
                  }))
                } else {
                  handleAddOptionToQuestion(
                    question.id, 
                    optionInputs[question.id] || "",
                    optionInputs[`${question.id}_maxQty`] || 1
                  )
                  setOptionInputs((prev) => ({ 
                    ...prev, 
                    [question.id]: "",
                    [`${question.id}_maxQty`]: ""
                  }))
                }
              }
            }}
            sx={{ minWidth: "150px" }}
          />
          
          {/* Max Quantity Input for quantity type questions */}
          {question.question_type === "quantity" && (
            <TextField
              size="small"
              type="number"
              label="Max Qty"
              value={isChild ? optionInputs[`child_${question.id}_maxQty`] || "" : optionInputs[`${question.id}_maxQty`] || ""}
              onChange={(e) =>
                setOptionInputs((prev) => ({
                  ...prev,
                  [isChild ? `child_${question.id}_maxQty` : `${question.id}_maxQty`]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  if (isChild) {
                    handleAddOptionToQuestion(
                      question.id,
                      optionInputs[`child_${question.id}`] || "",
                      optionInputs[`child_${question.id}_maxQty`] || 1,
                      true,
                      parentQuestionId,
                    )
                    setOptionInputs((prev) => ({ 
                      ...prev, 
                      [`child_${question.id}`]: "",
                      [`child_${question.id}_maxQty`]: ""
                    }))
                  } else {
                    handleAddOptionToQuestion(
                      question.id, 
                      optionInputs[question.id] || "",
                      optionInputs[`${question.id}_maxQty`] || 1
                    )
                    setOptionInputs((prev) => ({ 
                      ...prev, 
                      [question.id]: "",
                      [`${question.id}_maxQty`]: ""
                    }))
                  }
                }
              }}
              sx={{ width: "100px" }}
              inputProps={{ min: 1 }}
            />
          )}
          
          <Button
            onClick={() => {
              if (isChild) {
                handleAddOptionToQuestion(
                  question.id,
                  optionInputs[`child_${question.id}`] || "",
                  optionInputs[`child_${question.id}_maxQty`] || 1,
                  true,
                  parentQuestionId,
                )
                setOptionInputs((prev) => ({ 
                  ...prev, 
                  [`child_${question.id}`]: "",
                  [`child_${question.id}_maxQty`]: ""
                }))
              } else {
                handleAddOptionToQuestion(
                  question.id, 
                  optionInputs[question.id] || "",
                  optionInputs[`${question.id}_maxQty`] || 1
                )
                setOptionInputs((prev) => ({ 
                  ...prev, 
                  [question.id]: "",
                  [`${question.id}_maxQty`]: ""
                }))
              }
            }}
            disabled={!(isChild ? optionInputs[`child_${question.id}`] : optionInputs[question.id])?.trim()}
            variant="outlined"
            size="small"
          >
            Add
          </Button>
        </Box>
      </Box>
    )
  }

  const renderSubQuestionList = (question, isChild = false, parentQuestionId = null) => {
    const subQuestions = isChild ? question?.sub_questions || [] : question?.sub_questions || []

    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Sub-Questions:
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
          {subQuestions.map((subQuestion) => (
            <Box
              key={subQuestion.id || subQuestion.tempId || Math.random()}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                border: "1px solid #e0e0e0",
                padding: 0.5,
                borderRadius: 1,
              }}
            >
              {editingSubQuestionId === subQuestion.id ? (
                <TextField
                  size="small"
                  value={editingSubQuestionText}
                  onChange={(e) => setEditingSubQuestionText(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && editingSubQuestionText.trim()) {
                      try {
                        const result = await updateQuestionSubQuestion({
                          id: subQuestion.id,
                          sub_question_text: editingSubQuestionText.trim(),
                          question: question.id,
                        }).unwrap()

                        const updatedQuestions = questions.map((q) => {
                          if (!isChild && q.id === question.id) {
                            return {
                              ...q,
                              sub_questions: q.sub_questions.map((subQ) =>
                                subQ.id === subQuestion.id ? result : subQ,
                              ),
                            }
                          }
                          if (isChild && q.id === parentQuestionId) {
                            return {
                              ...q,
                              child_questions: q.child_questions.map((child) =>
                                child.id === question.id
                                  ? {
                                      ...child,
                                      sub_questions: child.sub_questions.map((subQ) =>
                                        subQ.id === subQuestion.id ? result : subQ,
                                      ),
                                    }
                                  : child,
                              ),
                            }
                          }
                          return q
                        })

                        setQuestions(updatedQuestions)
                        setEditingSubQuestionId(null)
                      } catch (err) {
                        console.error("Failed to update sub-question:", err)
                      }
                    } else if (e.key === "Escape") {
                      setEditingSubQuestionId(null)
                    }
                  }}
                  onBlur={() => setEditingSubQuestionId(null)}
                  autoFocus
                />
              ) : (
                <>
                  <Typography variant="body2">{subQuestion.sub_question_text || subQuestion}</Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingSubQuestionId(subQuestion.id)
                        setEditingSubQuestionText(subQuestion.sub_question_text || "")
                      }}
                      sx={{ p: 0 }}
                    >
                      <Edit sx={{ fontSize: "14px", color: "#9CCA6D" }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        handleDeleteSubQuestionFromQuestion(question.id, subQuestion.id, isChild, parentQuestionId)
                      }
                      sx={{ p: 0 }}
                    >
                      <Delete sx={{ fontSize: "14px", color: "#BE4B4B" }} />
                    </IconButton>
                  </Box>
                </>
              )}
            </Box>
          ))}
        </Box>

        {/* inline add */}
        <Box display="flex" gap={1} alignItems="center" mb={2}>
          <TextField
            size="small"
            label="New Sub-Question"
            value={isChild ? subQuestionInputs[`child_${question.id}`] || "" : subQuestionInputs[question.id] || ""}
            onChange={(e) =>
              setSubQuestionInputs((prev) => ({
                ...prev,
                [isChild ? `child_${question.id}` : question.id]: e.target.value,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                if (isChild) {
                  handleAddSubQuestionToQuestion(
                    question.id,
                    subQuestionInputs[`child_${question.id}`] || "",
                    true,
                    parentQuestionId,
                  )
                  setSubQuestionInputs((prev) => ({ ...prev, [`child_${question.id}`]: "" }))
                } else {
                  handleAddSubQuestionToQuestion(question.id, subQuestionInputs[question.id] || "")
                  setSubQuestionInputs((prev) => ({ ...prev, [question.id]: "" }))
                }
              }
            }}
          />
          <Button
            onClick={() => {
              if (isChild) {
                handleAddSubQuestionToQuestion(
                  question.id,
                  subQuestionInputs[`child_${question.id}`] || "",
                  true,
                  parentQuestionId,
                )
                setSubQuestionInputs((prev) => ({ ...prev, [`child_${question.id}`]: "" }))
              } else {
                handleAddSubQuestionToQuestion(question.id, subQuestionInputs[question.id] || "")
                setSubQuestionInputs((prev) => ({ ...prev, [question.id]: "" }))
              }
            }}
            disabled={!(isChild ? subQuestionInputs[`child_${question.id}`] : subQuestionInputs[question.id])?.trim()}
            variant="outlined"
            size="small"
          >
            Add
          </Button>
        </Box>
      </Box>
    )
  }

  const renderNewQuestionOptions = () => {
    if (!isOptionType(newQuestion.question_type)) return null

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Options:
        </Typography>

        {/* Display existing options */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {newQuestion.options.map((option) => (
            <Box
              key={option.tempId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              <TextField
                size="small"
                value={option.option_text}
                onChange={(e) => {
                  setNewQuestion((prev) => ({
                    ...prev,
                    options: prev.options.map((opt) =>
                      opt.tempId === option.tempId ? { ...opt, option_text: e.target.value } : opt,
                    ),
                  }))
                }}
                sx={{ flex: 1 }}
              />

              {newQuestion.question_type === "quantity" && (
                <>
                  {/* <FormControlLabel
                    control={
                      <Checkbox
                        checked={option.allow_quantity || false}
                        onChange={(e) => {
                          setNewQuestion((prev) => ({
                            ...prev,
                            options: prev.options.map((opt) =>
                              opt.tempId === option.tempId ? { ...opt, allow_quantity: e.target.checked } : opt,
                            ),
                          }))
                        }}
                      />
                    }
                    label="Allow Quantity"
                  /> */}
                  <TextField
                    size="small"
                    type="number"
                    label="Max Qty"
                    value={option.max_quantity || 1}
                    onChange={(e) => {
                      setNewQuestion((prev) => ({
                        ...prev,
                        options: prev.options.map((opt) =>
                          opt.tempId === option.tempId
                            ? { ...opt, max_quantity: Number.parseInt(e.target.value) || 1 }
                            : opt,
                        ),
                      }))
                    }}
                    sx={{ width: 100 }}
                  />
                </>
              )}

              <IconButton size="small" onClick={() => handleRemoveOptionFromNew(option.tempId)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* Add new option */}
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            label="New Option"
            value={optionInputs["new"] || ""}
            onChange={(e) => setOptionInputs((prev) => ({ ...prev, new: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddOptionToNewQuestion()
              }
            }}
          />
          <Button
            onClick={handleAddOptionToNewQuestion}
            disabled={!optionInputs["new"]?.trim()}
            variant="outlined"
            size="small"
          >
            Add Option
          </Button>
        </Box>

        {errors.options && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errors.options}
          </Typography>
        )}
      </Box>
    )
  }

  const renderNewQuestionSubQuestions = () => {
    if (!isSubQuestionType(newQuestion.question_type)) return null

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Sub-Questions:
        </Typography>

        {/* Display existing sub-questions */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {newQuestion.sub_questions.map((subQuestion) => (
            <Box
              key={subQuestion.tempId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              <TextField
                size="small"
                value={subQuestion.sub_question_text}
                onChange={(e) => {
                  setNewQuestion((prev) => ({
                    ...prev,
                    sub_questions: prev.sub_questions.map((subQ) =>
                      subQ.tempId === subQuestion.tempId ? { ...subQ, sub_question_text: e.target.value } : subQ,
                    ),
                  }))
                }}
                sx={{ flex: 1 }}
                placeholder="e.g., Do you need carpet cleaning?"
              />

              <IconButton size="small" onClick={() => handleRemoveSubQuestionFromNew(subQuestion.tempId)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* Add new sub-question */}
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            label="New Sub-Question"
            value={subQuestionInputs["new"] || ""}
            onChange={(e) => setSubQuestionInputs((prev) => ({ ...prev, new: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSubQuestionToNew()
              }
            }}
            placeholder="e.g., Do you need window cleaning?"
          />
          <Button
            onClick={handleAddSubQuestionToNew}
            disabled={!subQuestionInputs["new"]?.trim()}
            variant="outlined"
            size="small"
          >
            Add Sub-Question
          </Button>
        </Box>

        {errors.sub_questions && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {errors.sub_questions}
          </Typography>
        )}
      </Box>
    )
  }

  const renderConditionalChildOptions = () => {
    if (!newQuestion.conditional_child || !isOptionType(newQuestion.conditional_child.question_type)) return null

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Child Question Options:
        </Typography>

        {/* Display existing options */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {(newQuestion.conditional_child.options || []).map((option) => (
            <Box
              key={option.tempId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              <TextField
                size="small"
                value={option.option_text}
                onChange={(e) => {
                  setNewQuestion((prev) => ({
                    ...prev,
                    conditional_child: {
                      ...prev.conditional_child,
                      options: prev.conditional_child.options.map((opt) =>
                        opt.tempId === option.tempId ? { ...opt, option_text: e.target.value } : opt,
                      ),
                    },
                  }))
                }}
                sx={{ flex: 1 }}
              />

              {newQuestion.conditional_child.question_type === "quantity" && (
                <>
                  {/* <FormControlLabel
                    control={
                      <Checkbox
                        checked={option.allow_quantity || false}
                        onChange={(e) => {
                          setNewQuestion((prev) => ({
                            ...prev,
                            conditional_child: {
                              ...prev.conditional_child,
                              options: prev.conditional_child.options.map((opt) =>
                                opt.tempId === option.tempId ? { ...opt, allow_quantity: e.target.checked } : opt,
                              ),
                            },
                          }))
                        }}
                      />
                    }
                    label="Allow Quantity"
                  /> */}
                  <TextField
                    size="small"
                    type="number"
                    label="Max Qty"
                    value={option.max_quantity || 1}
                    onChange={(e) => {
                      setNewQuestion((prev) => ({
                        ...prev,
                        conditional_child: {
                          ...prev.conditional_child,
                          options: prev.conditional_child.options.map((opt) =>
                            opt.tempId === option.tempId
                              ? { ...opt, max_quantity: Number.parseInt(e.target.value) || 1 }
                              : opt,
                          ),
                        },
                      }))
                    }}
                    sx={{ width: 100 }}
                  />
                </>
              )}

              <IconButton size="small" onClick={() => handleRemoveOptionFromConditionalChild(option.tempId)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* Add new option */}
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            label="New Child Option"
            value={optionInputs["conditional_child"] || ""}
            onChange={(e) => setOptionInputs((prev) => ({ ...prev, conditional_child: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddOptionToConditionalChild()
              }
            }}
          />
          <Button
            onClick={handleAddOptionToConditionalChild}
            disabled={!optionInputs["conditional_child"]?.trim()}
            variant="outlined"
            size="small"
          >
            Add Option
          </Button>
        </Box>
      </Box>
    )
  }

  const renderConditionalChildSubQuestions = () => {
    if (!newQuestion.conditional_child || !isSubQuestionType(newQuestion.conditional_child.question_type)) return null

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Child Question Sub-Questions:
        </Typography>

        {/* Display existing sub-questions */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
          {(newQuestion.conditional_child.sub_questions || []).map((subQuestion) => (
            <Box
              key={subQuestion.tempId}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
              }}
            >
              <TextField
                size="small"
                value={subQuestion.sub_question_text}
                onChange={(e) => {
                  setNewQuestion((prev) => ({
                    ...prev,
                    conditional_child: {
                      ...prev.conditional_child,
                      sub_questions: prev.conditional_child.sub_questions.map((subQ) =>
                        subQ.tempId === subQuestion.tempId ? { ...subQ, sub_question_text: e.target.value } : subQ,
                      ),
                    },
                  }))
                }}
                sx={{ flex: 1 }}
                placeholder="e.g., Do you need deep carpet cleaning?"
              />

              <IconButton size="small" onClick={() => handleRemoveSubQuestionFromConditionalChild(subQuestion.tempId)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* Add new sub-question */}
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            label="New Child Sub-Question"
            value={subQuestionInputs["conditional_child"] || ""}
            onChange={(e) => setSubQuestionInputs((prev) => ({ ...prev, conditional_child: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleAddSubQuestionToConditionalChild()
              }
            }}
            placeholder="e.g., Do you need stain removal?"
          />
          <Button
            onClick={handleAddSubQuestionToConditionalChild}
            disabled={!subQuestionInputs["conditional_child"]?.trim()}
            variant="outlined"
            size="small"
          >
            Add Sub-Question
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Question Builder
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create questions that will be used for dynamic pricing calculations.
      </Typography>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Questions</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setQuestionDialogOpen(true)} disabled={!data.id}>
          Add Question
        </Button>
      </Box>

      {!data.id && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please save the service details first before adding questions.
        </Alert>
      )}

      {questions.length === 0 ? (
        <Typography color="text.secondary">No questions created yet.</Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box sx={{ flex: 1 }}>
                    {editingQuestionId === question.id ? (
                      <TextField
                        size="small"
                        variant="standard"
                        value={editingQuestionText}
                        onChange={(e) => setEditingQuestionText(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && editingQuestionText.trim()) {
                            try {
                              await updateExistingQuestion({
                                ...question,
                                question_text: editingQuestionText.trim(),
                              })
                            } finally {
                              setEditingQuestionId(null)
                            }
                          } else if (e.key === "Escape") {
                            setEditingQuestionId(null)
                          }
                        }}
                        onBlur={() => setEditingQuestionId(null)}
                        autoFocus
                        sx={{
                          pb: 1,
                          input: {
                            borderBottom: "2px solid #1976d2",
                            paddingBottom: "4px",
                          },
                          "& .MuiInput-underline:before": {
                            borderBottom: "none",
                          },
                          "& .MuiInput-underline:after": {
                            borderBottom: "2px solid #1976d2",
                          },
                        }}
                      />
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontSize={18} gutterBottom>
                          {question.question_text}
                        </Typography>
                        <Box
                          component="span"
                          sx={{
                            px: 1.2,
                            py: 0.5,
                            borderRadius: 2,
                            backgroundColor: question.is_active ? "#E8F5E9" : "#F5F5F5",
                            color: question.is_active ? "#388E3C" : "#9E9E9E",
                            fontSize: "12px",
                            display: "inline-block",
                          }}
                        >
                          {question.is_active ? "Active" : "Disabled"}
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingQuestionId(question.id)
                            setEditingQuestionText(question.question_text)
                          }}
                        >
                          <Edit sx={{ fontSize: "16px", color: "#1976d2" }} />
                        </IconButton>
                      </Box>
                    )}

                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip
                        label={
                          QUESTION_TYPES.find((t) => t.value === question.question_type)?.label ||
                          question.question_type
                        }
                        size="small"
                        color="primary"
                      />
                      <Chip label={`Order: ${question.order}`} size="small" variant="outlined" />
                    </Box>

                    {/* Display options for describe/quantity types with edit/delete functionality */}
                    {isOptionType(question.question_type) && renderOptionList(question)}

                    {/* Display sub-questions for multiple_yes_no type with edit/delete functionality */}
                    {isSubQuestionType(question.question_type) && renderSubQuestionList(question)}

                    {/* Display conditional child questions */}
                    {question.question_type === "conditional" &&
                      Array.isArray(question.child_questions) &&
                      question.child_questions.length > 0 && (
                        <Box sx={{ mt: 2, pl: 2, borderLeft: "2px solid #ccc" }}>
                          <Typography variant="subtitle2" gutterBottom>
                            If Yes, ask:
                          </Typography>
                          {question.child_questions.map((child, index) => (
                            <Card key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                              <Typography variant="body1" gutterBottom>
                                {child.question_text}
                              </Typography>
                              <Chip
                                label={
                                  QUESTION_TYPES.find((t) => t.value === child.question_type)?.label ||
                                  child.question_type
                                }
                                size="small"
                                color="secondary"
                              />
                              {/* Display child options with edit/delete functionality */}
                              {isOptionType(child.question_type) && renderOptionList(child, true, question.id)}
                              {/* Display child sub-questions with edit/delete functionality */}
                              {isSubQuestionType(child.question_type) &&
                                renderSubQuestionList(child, true, question.id)}
                            </Card>
                          ))}
                        </Box>
                      )}
                  </Box>

                  <Box>
                    <Tooltip title={question.is_active ? "Disable question" : "Enable question"}>
                      <IconButton onClick={() => handleToggleQuestionActive(question.id, question.is_active)}>
                        {question.is_active ? (
                          <Block sx={{ color: "#BE4B4B" }} />
                        ) : (
                          <Restore sx={{ color: "#4CAF50" }} />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Permanently delete">
                      <IconButton onClick={() => confirmHardDelete(question)}>
                        <Delete sx={{ color: "#D32F2F" }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog open={openConfirmModal} onClose={() => setOpenConfirmModal(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete{" "}
            <span style={{ fontSize: "18px", color: "#4E4FBB", fontWeight: "bold" }}>
              {selectedQuestion?.question_text}
            </span>{" "}
            question?
            <br />
            This action <strong>cannot be undone</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Question Dialog */}
      <Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Question</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              label="Question Text"
              fullWidth
              multiline
              rows={2}
              value={newQuestion.question_text}
              onChange={(e) => {
                setNewQuestion({
                  ...newQuestion,
                  question_text: e.target.value,
                })
                if (errors.question_text) {
                  setErrors((prev) => ({ ...prev, question_text: "" }))
                }
              }}
              placeholder="e.g., What type of cleaning service do you need?"
              error={!!errors.question_text}
              helperText={errors.question_text}
              required
            />

            <FormControl fullWidth>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={newQuestion.question_type}
                label="Question Type"
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev,
                    question_type: e.target.value,
                    options: isOptionType(e.target.value) ? prev.options : [],
                    sub_questions: isSubQuestionType(e.target.value) ? prev.sub_questions : [],
                    conditional_child: e.target.value === "conditional" ? prev.conditional_child : null,
                  }))
                }
              >
                {QUESTION_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderNewQuestionOptions()}
            {renderNewQuestionSubQuestions()}

            {/* Conditional Question Section */}
            {newQuestion.question_type === "conditional" && (
              <Box
                sx={{
                  mt: 1,
                  pl: 1,
                  borderLeft: "2px solid #ccc",
                }}
              >
                <Typography variant="subtitle2">If Yes, ask:</Typography>
                {newQuestion.conditional_child ? (
                  <Card variant="outlined" sx={{ p: 1, mb: 1 }}>
                    <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={1}>
                      <TextField
                        size="small"
                        label="Child Question Text"
                        value={newQuestion.conditional_child.question_text}
                        onChange={(e) =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            conditional_child: {
                              ...prev.conditional_child,
                              question_text: e.target.value,
                            },
                          }))
                        }
                        sx={{ flex: 1 }}
                      />
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Type</InputLabel>
                        <Select
                          value={newQuestion.conditional_child.question_type}
                          label="Type"
                          onChange={(e) =>
                            setNewQuestion((prev) => ({
                              ...prev,
                              conditional_child: {
                                ...prev.conditional_child,
                                question_type: e.target.value,
                                options: isOptionType(e.target.value) ? prev.conditional_child.options || [] : [],
                                sub_questions: isSubQuestionType(e.target.value)
                                  ? prev.conditional_child.sub_questions || []
                                  : [],
                              },
                            }))
                          }
                        >
                          {QUESTION_TYPES.filter((t) => t.value !== "conditional").map((t) => (
                            <MenuItem key={t.value} value={t.value}>
                              {t.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setNewQuestion((prev) => ({
                            ...prev,
                            conditional_child: null,
                          }))
                        }
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                    {renderConditionalChildOptions()}
                    {renderConditionalChildSubQuestions()}
                  </Card>
                ) : (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() =>
                      setNewQuestion((prev) => ({
                        ...prev,
                        conditional_child: {
                          question_text: "",
                          question_type: "describe",
                          order: prev.order + 0.1,
                          options: [],
                          sub_questions: [],
                        },
                      }))
                    }
                  >
                    Add child question for "Yes"
                  </Button>
                )}
                {errors.conditional_child && (
                  <Typography color="error" variant="body2">
                    {errors.conditional_child}
                  </Typography>
                )}
                {errors.conditional_child_options && (
                  <Typography color="error" variant="body2">
                    {errors.conditional_child_options}
                  </Typography>
                )}
                {errors.conditional_child_sub_questions && (
                  <Typography color="error" variant="body2">
                    {errors.conditional_child_sub_questions}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setQuestionDialogOpen(false)
              setErrors({})
              setNewQuestion({
                question_text: "",
                question_type: "describe",
                order: 1,
                options: [],
                sub_questions: [],
                parent_question: null,
                condition_answer: null,
                conditional_child: null,
              })
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddQuestion}
            variant="contained"
            disabled={!newQuestion.question_text.trim() || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            Add Question
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default QuestionBuilderForm
