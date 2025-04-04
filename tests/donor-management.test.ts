import { describe, it, expect, beforeEach } from "vitest"
import { mockClarityContext, type MockClarityContext } from "./helpers/clarity-mock"

describe("Donor Management Contract", () => {
  let context: MockClarityContext
  
  beforeEach(() => {
    context = mockClarityContext()
    context.loadContract("donor-management")
  })
  
  describe("get-total-donations", () => {
    it("should return 0 when no donations have been made", () => {
      // Act
      const result = context.callReadOnly("get-total-donations", [])
      
      // Assert
      expect(result).toBe(0)
    })
    
    it("should return the sum of all donations", () => {
      // Arrange
      const sender1 = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const sender2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
      const fundName = "Engineering-Scholarship"
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender: sender1 })
      
      // Make donations
      context.callPublic("donate", [fundName, 1000], { sender: sender1 })
      context.callPublic("donate", [fundName, 2000], { sender: sender2 })
      
      // Act
      const result = context.callReadOnly("get-total-donations", [])
      
      // Assert
      expect(result).toBe(3000)
    })
  })
  
  describe("get-donor-info", () => {
    it("should return default values for non-existent donor", () => {
      // Arrange
      const nonExistentDonor = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      
      // Act
      const result = context.callReadOnly("get-donor-info", [nonExistentDonor])
      
      // Assert
      expect(result.total_donated).toBe(0)
      expect(result.last_donation_block).toBe(0)
    })
    
    it("should return correct donor information after donation", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Engineering-Scholarship"
      const amount = 1500
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender })
      
      // Make donation
      context.callPublic("donate", [fundName, amount], { sender })
      
      // Act
      const result = context.callReadOnly("get-donor-info", [sender])
      
      // Assert
      expect(result.total_donated).toBe(amount)
      expect(result.last_donation_block).toBeGreaterThan(0) // Should have a block height
    })
    
    it("should update donor information after multiple donations", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Engineering-Scholarship"
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender })
      
      // Make first donation
      context.callPublic("donate", [fundName, 1000], { sender })
      
      // Make second donation
      context.callPublic("donate", [fundName, 500], { sender })
      
      // Act
      const result = context.callReadOnly("get-donor-info", [sender])
      
      // Assert
      expect(result.total_donated).toBe(1500) // Sum of both donations
      expect(result.last_donation_block).toBeGreaterThan(0)
    })
  })
  
  describe("get-fund-info", () => {
    it("should return default values for non-existent fund", () => {
      // Arrange
      const nonExistentFund = "Non-Existent-Fund"
      
      // Act
      const result = context.callReadOnly("get-fund-info", [nonExistentFund])
      
      // Assert
      expect(result.balance).toBe(0)
      expect(result.donors_count).toBe(0)
    })
    
    it("should return correct fund information after creation", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Computer-Science-Scholarship"
      
      // Create fund
      context.callPublic("create-fund", [fundName], { sender })
      
      // Act
      const result = context.callReadOnly("get-fund-info", [fundName])
      
      // Assert
      expect(result.balance).toBe(0)
      expect(result.donors_count).toBe(0)
    })
    
    it("should return correct fund information after donations", () => {
      // Arrange
      const sender1 = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const sender2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
      const fundName = "Engineering-Scholarship"
      
      // Create fund
      context.callPublic("create-fund", [fundName], { sender: sender1 })
      
      // Make donations from two different donors
      context.callPublic("donate", [fundName, 1000], { sender: sender1 })
      context.callPublic("donate", [fundName, 2000], { sender: sender2 })
      
      // Act
      const result = context.callReadOnly("get-fund-info", [fundName])
      
      // Assert
      expect(result.balance).toBe(3000) // Sum of all donations
      expect(result.donors_count).toBe(2) // Two unique donors
    })
  })
  
  describe("create-fund", () => {
    it("should successfully create a new fund", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Computer-Science-Scholarship"
      
      // Act
      const result = context.callPublic("create-fund", [fundName], { sender })
      
      // Assert
      expect(result.success).toBe(true)
      
      // Check fund was created
      const fundInfo = context.callReadOnly("get-fund-info", [fundName])
      expect(fundInfo.balance).toBe(0)
      expect(fundInfo.donors_count).toBe(0)
    })
    
    it("should fail when fund already exists", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Computer-Science-Scholarship"
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender })
      
      // Act - Try to create the same fund again
      const result = context.callPublic("create-fund", [fundName], { sender })
      
      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe(404) // ERR-FUND-NOT-FOUND
    })
    
    it("should allow creating multiple funds", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName1 = "Computer-Science-Scholarship"
      const fundName2 = "Engineering-Scholarship"
      const fundName3 = "Mathematics-Scholarship"
      
      // Act
      const result1 = context.callPublic("create-fund", [fundName1], { sender })
      const result2 = context.callPublic("create-fund", [fundName2], { sender })
      const result3 = context.callPublic("create-fund", [fundName3], { sender })
      
      // Assert
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result3.success).toBe(true)
      
      // Check all funds were created
      const fundInfo1 = context.callReadOnly("get-fund-info", [fundName1])
      const fundInfo2 = context.callReadOnly("get-fund-info", [fundName2])
      const fundInfo3 = context.callReadOnly("get-fund-info", [fundName3])
      
      expect(fundInfo1.balance).toBe(0)
      expect(fundInfo2.balance).toBe(0)
      expect(fundInfo3.balance).toBe(0)
    })
  })
  
  describe("donate", () => {
    it("should successfully record a donation", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Engineering-Scholarship"
      const amount = 1000
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender })
      
      // Act
      const result = context.callPublic("donate", [fundName, amount], { sender })
      
      // Assert
      expect(result.success).toBe(true)
      expect(result.value).toBe(amount)
      
      // Check donor info was updated
      const donorInfo = context.callReadOnly("get-donor-info", [sender])
      expect(donorInfo.total_donated).toBe(amount)
      
      // Check fund info was updated
      const fundInfo = context.callReadOnly("get-fund-info", [fundName])
      expect(fundInfo.balance).toBe(amount)
      expect(fundInfo.donors_count).toBe(1)
      
      // Check total donations was updated
      const totalDonations = context.callReadOnly("get-total-donations", [])
      expect(totalDonations).toBe(amount)
    })
    
    it("should fail when amount is zero", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Engineering-Scholarship"
      const amount = 0
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender })
      
      // Act
      const result = context.callPublic("donate", [fundName, amount], { sender })
      
      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe(402) // ERR-INVALID-AMOUNT
    })
    
    it("should increment donors count only for first donation", () => {
      // Arrange
      const sender = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const fundName = "Engineering-Scholarship"
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender })
      
      // Act - First donation
      context.callPublic("donate", [fundName, 1000], { sender })
      
      // Check fund info after first donation
      let fundInfo = context.callReadOnly("get-fund-info", [fundName])
      expect(fundInfo.balance).toBe(1000)
      expect(fundInfo.donors_count).toBe(1)
      
      // Act - Second donation
      context.callPublic("donate", [fundName, 500], { sender })
      
      // Assert - donors_count should still be 1
      fundInfo = context.callReadOnly("get-fund-info", [fundName])
      expect(fundInfo.balance).toBe(1500)
      expect(fundInfo.donors_count).toBe(1)
    })
    
    it("should correctly track multiple donors to the same fund", () => {
      // Arrange
      const sender1 = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
      const sender2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG"
      const sender3 = "ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP"
      const fundName = "Engineering-Scholarship"
      
      // Create fund first
      context.callPublic("create-fund", [fundName], { sender: sender1 })
      
      // Act - Donations from multiple donors
      context.callPublic("donate", [fundName, 1000], { sender: sender1 })
      context.callPublic("donate", [fundName, 2000], { sender: sender2 })
      context.callPublic("donate", [fundName, 1500], { sender: sender3 })
      
      // Assert
      const fundInfo = context.callReadOnly("get-fund-info", [fundName])
      expect(fundInfo.balance).toBe(4500) // Sum of all donations
      expect(fundInfo.donors_count).toBe(3) // Three unique donors
      
      // Check individual donor info
      const donorInfo1 = context.callReadOnly("get-donor-info", [sender1])
      const donorInfo2 = context.callReadOnly("get-donor-info", [sender2])
      const donorInfo3 = context.callReadOnly("get-donor-info", [sender3])
      
      expect(donorInfo1.total_donated).toBe(1000)
      expect(donorInfo2.total_donated).toBe(2000)
      expect(donorInfo3.total_donated).toBe(1500)
    })
    
  })
})

