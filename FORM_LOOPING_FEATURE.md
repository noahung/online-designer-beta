# Form Looping Feature - Repeatable Sections

## 🎯 Overview

This feature allows users to repeat a section of the form multiple times within a single submission, perfect for scenarios like:
- Multiple window/door quotes in one request
- Multiple properties to evaluate
- Multiple product selections
- Adding multiple team members

## 💡 Use Case Example
A customer wants quotes for **3 different windows**:
1. Fill out window details (size, style, location) for Window #1
2. Click "Add Another Window" 
3. Goes back to the same questions, fills out Window #2
4. Click "Add Another Window"
5. Goes back again, fills out Window #3
6. Click "Continue to Next Step"
7. All 3 sets of answers saved in a single form submission

---

## 🏗️ Implementation Architecture

### 1. New Question Type: `loop_section`

```typescript
question_type: 'loop_section'
```

This special question type:
- Displays options: "Add Another [Item]" and "Continue"
- Stores loop configuration (start step, end step, max iterations)
- Tracks how many times user has looped through the section

### 2. Loop Configuration

Each `loop_section` step stores:
```typescript
{
  loop_start_step_id: string,  // First step of the repeatable section
  loop_end_step_id: string,     // Last step of the repeatable section  
  loop_label: string,           // e.g., "Window", "Property", "Frame"
  loop_max_iterations: number,  // Max times user can repeat (default: 10)
  loop_button_text: string      // e.g., "Add Another Window"
}
```

### 3. Response Data Structure

Responses are stored with iteration metadata:

```typescript
// response_answers table gets new column
{
  iteration_number: number  // Which loop iteration (1, 2, 3...)
}
```

**Example in database:**
```
Response ID: abc-123
├─ Question 1 (Name): "John Doe" (iteration: 0 - not in loop)
├─ Question 2 (Window Type): "Double Glazed" (iteration: 1)
├─ Question 3 (Window Size): "100x150cm" (iteration: 1)
├─ Question 2 (Window Type): "Casement" (iteration: 2)
├─ Question 3 (Window Size): "80x120cm" (iteration: 2)
├─ Question 4 (Contact Email): "john@example.com" (iteration: 0)
```

---

## 📝 Implementation Steps

### Phase 1: Database Schema

```sql
-- Add loop configuration columns to form_steps table
ALTER TABLE form_steps ADD COLUMN loop_start_step_id UUID REFERENCES form_steps(id);
ALTER TABLE form_steps ADD COLUMN loop_end_step_id UUID REFERENCES form_steps(id);
ALTER TABLE form_steps ADD COLUMN loop_label TEXT;
ALTER TABLE form_steps ADD COLUMN loop_max_iterations INTEGER DEFAULT 10;
ALTER TABLE form_steps ADD COLUMN loop_button_text TEXT;

-- Add iteration tracking to response_answers
ALTER TABLE response_answers ADD COLUMN iteration_number INTEGER DEFAULT 0;
```

### Phase 2: Form Builder UI

**Add Loop Section Button:**
- New button in step type selector
- Configuration panel for loop settings:
  - Select start step (dropdown of previous steps)
  - Select end step (dropdown of previous steps)
  - Set item label (e.g., "Window", "Property")
  - Set max iterations
  - Customize button text

**Visual Indicators:**
- Show loop boundaries with colored brackets/lines
- Display "Looped Section" badges on steps within loop range

### Phase 3: FormEmbed Logic

**State Management:**
```typescript
const [loopIterations, setLoopIterations] = useState<Map<string, number>>(new Map())
const [currentIteration, setCurrentIteration] = useState<number>(0)
const [inLoop, setInLoop] = useState<boolean>(false)
const [loopConfig, setLoopConfig] = useState<LoopConfig | null>(null)
```

**Loop Navigation:**
1. When user reaches `loop_section` step:
   - Display two options:
     - "Add Another [Item]" → Go to loop_start_step, increment iteration
     - "Continue" → Go to next step after loop, reset iteration
   
2. Track which iteration user is on

3. Save responses with iteration number

4. Show progress indicator: "Window 2 of 3" or "Adding Window #2"

### Phase 4: Response Display

**In Responses Page:**
- Group answers by iteration
- Display like:
  ```
  Window #1:
  - Type: Double Glazed
  - Size: 100x150cm
  
  Window #2:
  - Type: Casement  
  - Size: 80x120cm
  ```

**In Email Notifications:**
- Format looped answers with clear grouping
- Section headers for each iteration

---

## 🎨 User Experience Flow

### Form Builder (Admin)
1. Create form with questions 1-5
2. After question 5, add "Loop Section" step
3. Configure:
   - Loop from: Question 2
   - Loop to: Question 5
   - Label: "Window"
   - Button: "Add Another Window"
   - Max: 10 iterations
4. User can continue adding questions after loop section

### Form Filling (End User)
1. Answer Question 1 (Name)
2. Answer Questions 2-5 (Window details) → Iteration 1
3. Reach loop section:
   ```
   [✓] Add Another Window
   [→] Continue to Contact Details
   ```
4. Click "Add Another Window"
5. Go back to Question 2, progress shows "Window #2"
6. Answer Questions 2-5 again → Iteration 2
7. Reach loop section again:
   ```
   [✓] Add Another Window (3 of 10 remaining)
   [→] Continue to Contact Details
   ```
8. Click "Continue"
9. Proceed to next question after loop section

### Response Viewing (Admin)
```
Contact Form Response
Submitted: Jan 15, 2026

Name: John Doe

━━━ Window #1 ━━━
Type: Double Glazed
Size: 100x150cm
Style: Casement

━━━ Window #2 ━━━
Type: Triple Glazed
Size: 80x120cm
Style: Sliding

Contact Email: john@example.com
```

---

## ✨ Advanced Features (Future Enhancements)

### 1. **Dynamic Section Titles**
- Let user name each iteration: "Kitchen Window", "Bedroom Window"
- Show custom names in responses

### 2. **Conditional Loop Limits**
- Adjust max iterations based on previous answers
- E.g., "How many windows?" → Set max iterations dynamically

### 3. **Loop Summary Preview**
- Show quick summary of all iterations before continuing
- Allow editing previous iterations

### 4. **Copy Previous Iteration**
- Button to duplicate previous iteration's answers
- Speed up data entry for similar items

### 5. **Skip Remaining**
- Option to skip back to loop section if user finishes early
- E.g., planned for 5 windows, only needs 3

---

## 🚀 Benefits

### For Form Creators:
- ✅ No need to duplicate questions for multiple items
- ✅ Flexible: User decides how many times to repeat
- ✅ Clean form structure
- ✅ Easy to maintain (update questions once)

### For Form Fillers:
- ✅ Natural flow: Add as many items as needed
- ✅ Clear progress tracking
- ✅ No need to submit multiple times
- ✅ All data in one place

### For Response Processing:
- ✅ Structured data with clear grouping
- ✅ Easy to parse and export
- ✅ Works with existing webhook/email system
- ✅ CSV export groups by iteration

---

## 📊 Technical Considerations

### Database Impact:
- **Minimal** - One new column per answer (iteration_number)
- **Backward compatible** - Default iteration_number = 0 for non-looped answers
- **Efficient** - No additional tables needed

### Performance:
- **Minimal impact** - Same as normal multi-step form
- **Scalable** - Handles 10+ iterations without issues
- **Indexing** - Add index on (response_id, iteration_number) for fast queries

### Complexity:
- **Medium** - Requires careful state management in FormEmbed
- **Testable** - Clear boundaries between iterations
- **Maintainable** - Separate loop logic from normal navigation

---

## 🧪 Testing Checklist

- [ ] Create loop section in Form Builder
- [ ] Configure loop boundaries and settings
- [ ] Test form with 1 iteration (skip loop)
- [ ] Test form with multiple iterations (2-5)
- [ ] Test form reaching max iterations
- [ ] Verify responses saved with correct iteration numbers
- [ ] Check response display groups iterations
- [ ] Test email notifications format looped answers
- [ ] Verify CSV export includes iteration grouping
- [ ] Test conditional logic within looped sections
- [ ] Test conditional logic jumping out of loops
- [ ] Test browser back button behavior in loops

---

## 📦 Delivery Phases

### **Phase 1 - MVP (Core Functionality)**
- Database schema updates
- Basic loop section step type
- Simple loop navigation in FormEmbed
- Response grouping by iteration
- ~8-12 hours development

### **Phase 2 - Polish**
- Enhanced UI in Form Builder
- Visual loop indicators
- Progress tracking ("Window 2 of 5")
- Improved response display
- ~4-6 hours development

### **Phase 3 - Advanced Features**
- Dynamic section naming
- Copy previous iteration
- Loop summary preview
- Enhanced CSV exports
- ~6-8 hours development

---

## 🎯 Recommended Approach

**Start with Phase 1 MVP:**
1. Add database columns
2. Create basic `loop_section` question type
3. Implement simple loop navigation
4. Test with real use case (windows/frames)
5. Gather feedback
6. Iterate with Phase 2 & 3

This feature is **definitely feasible** and would be a powerful addition to your form builder! The architecture leverages your existing step-based system and response structure.

Would you like me to start implementing Phase 1?
