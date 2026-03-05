import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseService, expenseKeys, ExpenseRequestFilters, ExpenseRequestInsert, ExpenseRequestUpdate } from '@/services/expense.service'
import { toast } from 'react-hot-toast'

// Get all expense requests
export function useExpenseRequests(filters: ExpenseRequestFilters = {}) {
  return useQuery({
    queryKey: expenseKeys.list(filters),
    queryFn: () => expenseService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get expense request by ID
export function useExpenseRequest(id: string) {
  return useQuery({
    queryKey: expenseKeys.detail(id),
    queryFn: () => expenseService.getById(id),
    enabled: !!id,
  })
}

// Get expense requests requiring approval
export function useExpenseApprovalsForUser(userId: string) {
  return useQuery({
    queryKey: expenseKeys.approvals(userId),
    queryFn: () => expenseService.getRequiringApproval(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

// Get expense statistics
export function useExpenseStats() {
  return useQuery({
    queryKey: expenseKeys.stats(),
    queryFn: () => expenseService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get expenses by travel request
export function useExpensesByTravel(travelRequestId: string) {
  return useQuery({
    queryKey: expenseKeys.byTravel(travelRequestId),
    queryFn: () => expenseService.getByTravelRequest(travelRequestId),
    enabled: !!travelRequestId,
  })
}

// Create expense request
export function useCreateExpenseRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Omit<ExpenseRequestInsert, 'expense_number'>) => 
      expenseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      toast.success('Expense request created successfully')
    },
    onError: (error) => {
      console.error('Error creating expense request:', error)
      toast.error('Failed to create expense request')
    },
  })
}

// Update expense request
export function useUpdateExpenseRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ExpenseRequestUpdate }) =>
      expenseService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      queryClient.setQueryData(expenseKeys.detail(data.id), data)
      toast.success('Expense request updated successfully')
    },
    onError: (error) => {
      console.error('Error updating expense request:', error)
      toast.error('Failed to update expense request')
    },
  })
}

// Submit expense request
export function useSubmitExpenseRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      employeeId, 
      employeeName, 
      department 
    }: { 
      id: string
      employeeId: string
      employeeName: string
      department?: string 
    }) => expenseService.submit(id, employeeId, employeeName, department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      toast.success('Expense request submitted for approval')
    },
    onError: (error) => {
      console.error('Error submitting expense request:', error)
      toast.error('Failed to submit expense request')
    },
  })
}

// Approve expense request
export function useApproveExpenseRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      approverId, 
      comments 
    }: { 
      id: string
      approverId: string
      comments?: string 
    }) => expenseService.approve(id, approverId, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      toast.success('Expense request approved')
    },
    onError: (error) => {
      console.error('Error approving expense request:', error)
      toast.error('Failed to approve expense request')
    },
  })
}

// Reject expense request
export function useRejectExpenseRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      id, 
      approverId, 
      reason 
    }: { 
      id: string
      approverId: string
      reason: string 
    }) => expenseService.reject(id, approverId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      toast.success('Expense request rejected')
    },
    onError: (error) => {
      console.error('Error rejecting expense request:', error)
      toast.error('Failed to reject expense request')
    },
  })
}

// Mark expense as reimbursed
export function useReimburseExpense() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => expenseService.reimburse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      toast.success('Expense marked as reimbursed')
    },
    onError: (error) => {
      console.error('Error marking expense as reimbursed:', error)
      toast.error('Failed to update expense status')
    },
  })
}

// Cancel expense request
export function useCancelExpenseRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => expenseService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      toast.success('Expense request cancelled')
    },
    onError: (error) => {
      console.error('Error cancelling expense request:', error)
      toast.error('Failed to cancel expense request')
    },
  })
}

// Delete expense request
export function useDeleteExpenseRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => expenseService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.all })
      toast.success('Expense request deleted successfully')
    },
    onError: (error) => {
      console.error('Error deleting expense request:', error)
      toast.error('Failed to delete expense request')
    },
  })
}