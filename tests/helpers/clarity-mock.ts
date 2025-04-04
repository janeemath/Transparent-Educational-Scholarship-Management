/**
 * A simple mock implementation for testing Clarity contracts
 * This is a simplified version that doesn't actually execute Clarity code
 * but simulates the behavior for testing purposes
 */

export interface MockClarityContext {
	loadContract: (contractName: string) => void
	callPublic: (functionName: string, args: any[], options?: { sender?: string; contract?: string }) => any
	callReadOnly: (functionName: string, args: any[], options?: { contract?: string }) => any
}

export function mockClarityBitcoin() {
	return {
		// Mock Bitcoin-related functions
		get_block_info: () => 0,
		get_txid: () => "0x0000000000000000000000000000000000000000000000000000000000000000",
	}
}

export function mockClarityContext(): MockClarityContext {
	// In-memory storage for contract data
	const storage = {
		"donor-management": {
			maps: {
				donors: {},
				"scholarship-funds": {},
			},
			vars: {
				"total-donations": 0,
			},
		},
		"student-verification": {
			maps: {
				students: {},
				verifiers: {},
			},
		},
		"award-allocation": {
			maps: {
				scholarships: {},
				applications: {},
				awards: {},
			},
			vars: {
				"award-counter": 0,
			},
		},
		"academic-progress": {
			maps: {
				progress: {},
				verifiers: {},
			},
		},
	}
	
	// Mock contract implementations
	const contractImplementations = {
		"donor-management": {
			"get-total-donations": () => storage["donor-management"].vars["total-donations"],
			"get-donor-info": (donor) =>
				storage["donor-management"].maps.donors[donor] || { total_donated: 0, last_donation_block: 0 },
			"get-fund-info": (fundName) =>
				storage["donor-management"].maps["scholarship-funds"][fundName] || { balance: 0, donors_count: 0 },
			donate: (fundName, amount, { sender }) => {
				if (amount <= 0) return { success: false, error: 402 }
				
				const fund = storage["donor-management"].maps["scholarship-funds"][fundName] || { balance: 0, donors_count: 0 }
				const donor = storage["donor-management"].maps.donors[sender] || { total_donated: 0, last_donation_block: 0 }
				const isNewDonor = donor.total_donated === 0
				
				storage["donor-management"].vars["total-donations"] += amount
				
				storage["donor-management"].maps.donors[sender] = {
					total_donated: donor.total_donated + amount,
					last_donation_block: 100, // Mock block height
				}
				
				storage["donor-management"].maps["scholarship-funds"][fundName] = {
					balance: fund.balance + amount,
					donors_count: isNewDonor ? fund.donors_count + 1 : fund.donors_count,
				}
				
				return { success: true, value: amount }
			},
			"create-fund": (fundName, { sender }) => {
				if (storage["donor-management"].maps["scholarship-funds"][fundName]) {
					return { success: false, error: 404 }
				}
				
				storage["donor-management"].maps["scholarship-funds"][fundName] = {
					balance: 0,
					donors_count: 0,
				}
				
				return { success: true, value: true }
			},
		},
		"student-verification": {
			"get-student-info": (student) =>
				storage["student-verification"].maps.students[student] || {
					verified: false,
					academic_id: "",
					gpa: 0,
					institution: "",
					verification_block: 0,
				},
			"is-verifier": (address) => storage["student-verification"].maps.verifiers[address] || false,
			"add-verifier": (verifier, { sender }) => {
				// In a real implementation, we'd check if sender is contract owner
				// For simplicity, we'll allow ST000000000000000000000000000000000000000000 as owner
				if (sender !== "ST000000000000000000000000000000000000000000") {
					return { success: false, error: 401 }
				}
				
				storage["student-verification"].maps.verifiers[verifier] = true
				return { success: true, value: true }
			},
			"verify-student": (student, academicId, gpa, institution, { sender }) => {
				if (!storage["student-verification"].maps.verifiers[sender]) {
					return { success: false, error: 401 }
				}
				
				if (gpa > 400) {
					return { success: false, error: 403 }
				}
				
				const studentInfo = storage["student-verification"].maps.students[student] || {
					verified: false,
					academic_id: "",
					gpa: 0,
					institution: "",
					verification_block: 0,
				}
				
				if (studentInfo.verified) {
					return { success: false, error: 402 }
				}
				
				storage["student-verification"].maps.students[student] = {
					verified: true,
					academic_id: academicId,
					gpa: gpa,
					institution: institution,
					verification_block: 100, // Mock block height
				}
				
				return { success: true, value: true }
			},
			"update-student-info": (student, gpa, institution, { sender }) => {
				if (!storage["student-verification"].maps.verifiers[sender]) {
					return { success: false, error: 401 }
				}
				
				const studentInfo = storage["student-verification"].maps.students[student] || {
					verified: false,
					academic_id: "",
					gpa: 0,
					institution: "",
					verification_block: 0,
				}
				
				if (!studentInfo.verified) {
					return { success: false, error: 403 }
				}
				
				if (gpa > 400) {
					return { success: false, error: 403 }
				}
				
				storage["student-verification"].maps.students[student] = {
					...studentInfo,
					gpa: gpa,
					institution: institution,
					verification_block: 100, // Mock block height
				}
				
				return { success: true, value: true }
			},
		},
		"award-allocation": {
			"get-scholarship-info": (scholarshipId) =>
				storage["award-allocation"].maps.scholarships[scholarshipId] || {
					fund_name: "",
					amount: 0,
					min_gpa: 0,
					institution: "",
					application_deadline: 0,
					is_active: false,
				},
			"get-application-info": (scholarshipId, student) => {
				const key = `${scholarshipId}-${student}`
				return storage["award-allocation"].maps.applications[key] || { application_block: 0, status: "none" }
			},
			"get-award-info": (awardId) =>
				storage["award-allocation"].maps.awards[awardId] || {
					scholarship_id: "",
					student: "ST000000000000000000000000000000000000000000",
					amount: 0,
					award_block: 0,
				},
			"create-scholarship": (scholarshipId, fundName, amount, minGpa, institution, applicationDeadline, { sender }) => {
				if (sender !== "ST000000000000000000000000000000000000000000") {
					return { success: false, error: 401 }
				}
				
				if (amount <= 0 || applicationDeadline < 100) {
					// Mock current block height
					return { success: false, error: 402 }
				}
				
				storage["award-allocation"].maps.scholarships[scholarshipId] = {
					fund_name: fundName,
					amount: amount,
					min_gpa: minGpa,
					institution: institution,
					application_deadline: applicationDeadline,
					is_active: true,
				}
				
				return { success: true, value: true }
			},
			"apply-for-scholarship": (scholarshipId, { sender }) => {
				const scholarship = storage["award-allocation"].maps.scholarships[scholarshipId]
				if (!scholarship || !scholarship.is_active) {
					return { success: false, error: 405 }
				}
				
				if (scholarship.application_deadline < 100) {
					// Mock current block height
					return { success: false, error: 403 }
				}
				
				// Check if student is verified and meets requirements
				const studentInfo = storage["student-verification"].maps.students[sender]
				if (!studentInfo || !studentInfo.verified) {
					return { success: false, error: 406 }
				}
				
				if (studentInfo.gpa < scholarship.min_gpa) {
					return { success: false, error: 402 }
				}
				
				const key = `${scholarshipId}-${sender}`
				const existingApplication = storage["award-allocation"].maps.applications[key]
				if (existingApplication && existingApplication.status !== "none") {
					return { success: false, error: 404 }
				}
				
				storage["award-allocation"].maps.applications[key] = {
					application_block: 100, // Mock block height
					status: "pending",
				}
				
				return { success: true, value: true }
			},
			"approve-application": (scholarshipId, student, { sender }) => {
				if (sender !== "ST000000000000000000000000000000000000000000") {
					return { success: false, error: 401 }
				}
				
				const key = `${scholarshipId}-${student}`
				const application = storage["award-allocation"].maps.applications[key]
				if (!application || application.status !== "pending") {
					return { success: false, error: 402 }
				}
				
				const scholarship = storage["award-allocation"].maps.scholarships[scholarshipId]
				
				storage["award-allocation"].maps.applications[key] = {
					application_block: application.application_block,
					status: "approved",
				}
				
				const awardId = storage["award-allocation"].vars["award-counter"] + 1
				storage["award-allocation"].maps.awards[awardId] = {
					scholarship_id: scholarshipId,
					student: student,
					amount: scholarship.amount,
					award_block: 100, // Mock block height
				}
				
				storage["award-allocation"].vars["award-counter"] = awardId
				
				return { success: true, value: awardId }
			},
			"reject-application": (scholarshipId, student, { sender }) => {
				if (sender !== "ST000000000000000000000000000000000000000000") {
					return { success: false, error: 401 }
				}
				
				const key = `${scholarshipId}-${student}`
				const application = storage["award-allocation"].maps.applications[key]
				if (!application || application.status !== "pending") {
					return { success: false, error: 402 }
				}
				
				storage["award-allocation"].maps.applications[key] = {
					application_block: application.application_block,
					status: "rejected",
				}
				
				return { success: true, value: true }
			},
		},
		"academic-progress": {
			"get-progress": (student, semester) => {
				const key = `${student}-${semester}`
				return (
					storage["academic-progress"].maps.progress[key] || {
						gpa: 0,
						credits_completed: 0,
						status: "none",
						report_block: 0,
					}
				)
			},
			"is-verifier": (address) => storage["academic-progress"].maps.verifiers[address] || false,
			"add-verifier": (verifier, { sender }) => {
				if (sender !== "ST000000000000000000000000000000000000000000") {
					return { success: false, error: 401 }
				}
				
				storage["academic-progress"].maps.verifiers[verifier] = true
				return { success: true, value: true }
			},
			"report-progress": (student, semester, gpa, creditsCompleted, { sender }) => {
				if (!storage["academic-progress"].maps.verifiers[sender]) {
					return { success: false, error: 401 }
				}
				
				if (gpa > 400) {
					return { success: false, error: 402 }
				}
				
				let status
				if (gpa >= 300 && creditsCompleted >= 12) {
					status = "good"
				} else if (gpa >= 200) {
					status = "probation"
				} else {
					status = "terminated"
				}
				
				const key = `${student}-${semester}`
				storage["academic-progress"].maps.progress[key] = {
					gpa: gpa,
					credits_completed: creditsCompleted,
					status: status,
					report_block: 100, // Mock block height
				}
				
				return { success: true, value: true }
			},
		},
	}
	
	return {
		loadContract: (contractName: string) => {
			// Initialize contract storage if needed
			if (!storage[contractName]) {
				storage[contractName] = {
					maps: {},
					vars: {},
				}
			}
		},
		
		callPublic: (functionName: string, args: any[], options: { sender?: string; contract?: string } = {}) => {
			const contractName = options.contract || "donor-management"
			const sender = options.sender || "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
			
			if (!contractImplementations[contractName] || !contractImplementations[contractName][functionName]) {
				return { success: false, error: "Function not implemented" }
			}
			
			return contractImplementations[contractName][functionName](...args, { sender })
		},
		
		callReadOnly: (functionName: string, args: any[], options: { contract?: string } = {}) => {
			const contractName = options.contract || "donor-management"
			
			if (!contractImplementations[contractName] || !contractImplementations[contractName][functionName]) {
				return null
			}
			
			return contractImplementations[contractName][functionName](...args)
		},
	}
}

