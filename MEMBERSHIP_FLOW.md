# IBON International Membership Application Flow

## User Journey

### Phase 1: Application (Applicant)
1. **Visit** `/membership/apply` (public page)
2. **Fill Form** with all details:
   - Personal info (name, age, citizenship, address, contact)
   - Education background
   - Current organizational affiliation
   - How they learned about IBON
   - Why they want to join
   - IBON engagement history
   - Endorser reference
3. **Submit** → Application saved with status `submitted`
4. **Receive** confirmation email with reference number

### Phase 2: Review (Admin/Governance Team)
1. **Admin Dashboard** `/admin/governance/membership-applications`
2. **View Applications** with filters (new, approved, rejected)
3. **Review Details** in side panel
4. **Actions**:
   - ✅ **Approve** → Auto-create member record, send welcome email
   - ❌ **Reject** → Send rejection email with reason
   - 📝 **Request More Info** → Send follow-up, pause review
   - 👥 **Verify Endorser** → Click to verify endorsement

### Phase 3: Onboarding (New Member)
1. **Member Created** in system with status `pending_activation`
2. **Welcome Email** sent with:
   - Login credentials / Magic link
   - Welcome package
   - Membership terms
   - Payment/dues information
   - Link to online member directory
3. **Member Logs In** → Completes profile photo, updates preferences
4. **Member Status** → `active`
5. **First Engagement** → Can register for events, join committees, etc.

---

## Database Flow

```
Application Submitted
    ↓
member_applications table created (status: 'submitted')
    ↓
Admin Reviews (Admin Dashboard)
    ↓
    ├→ Approved: Create 'members' record, send welcome
    ├→ Rejected: Update app status, send rejection email
    └→ Request Info: Update status, send request email
    
Member Created
    ↓
Send verification link
    ↓
Member activates account
    ↓
member.status = 'active'
    ↓
Member can participate in engagements, committees, etc.
```

---

## Key Features

### For Applicants
- ✅ Public, easy-to-use form
- ✅ Save progress as draft
- ✅ File upload for attachments (ID, recommendation letter)
- ✅ Real-time email validation
- ✅ Confirmation after submission

### For Admin
- ✅ Dashboard view all applications
- ✅ Bulk actions (approve multiple, export list)
- ✅ Notes/comments field
- ✅ Endorser verification workflow
- ✅ Reject with template reasons
- ✅ Audit trail of all decisions

### For Governance
- ✅ Analytics: applications per month, approval rate
- ✅ Export applicant list (CSV)
- ✅ Filter by source (how they learned), organization type
- ✅ Integration with membership dues

---

## Email Templates Needed

1. **Confirmation** - After application submitted
2. **Under Review** - After admin opens application
3. **More Information Requested** - When admin needs clarification
4. **Approved** - With login instructions
5. **Rejected** - With reason and reapplication option
6. **Welcome** - First login instructions
7. **Endorser Notification** - Asking for verification

---

## Status Flow Diagram

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → MEMBER_CREATED → ACTIVE
                         ↓
                     REJECTED
                         ↓
                  (Can reapply)
                  
                    OR
                         ↓
                  MORE_INFO_NEEDED
                         ↓
                     RESUBMITTED
                         ↓
                     UNDER_REVIEW...
```
