;; Student Verification Contract
;; Validates qualifications of applicants

;; Define data variables
(define-map students principal {
  verified: bool,
  academic-id: (string-ascii 64),
  gpa: uint,
  institution: (string-ascii 64),
  verification-block: uint
})

(define-map verifiers principal bool)

;; Error codes
(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-ALREADY-VERIFIED u402)
(define-constant ERR-INVALID-DATA u403)

;; Read-only functions
(define-read-only (get-student-info (student principal))
  (default-to
    {verified: false, academic-id: "", gpa: u0, institution: "", verification-block: u0}
    (map-get? students student)
  )
)

(define-read-only (is-verifier (address principal))
  (default-to false (map-get? verifiers address))
)

;; Public functions
(define-public (add-verifier (verifier principal))
  (begin
    ;; Only contract owner can add verifiers
    (asserts! (is-eq tx-sender (as-contract tx-sender)) (err ERR-UNAUTHORIZED))
    (map-set verifiers verifier true)
    (ok true)
  )
)

(define-public (verify-student
  (student principal)
  (academic-id (string-ascii 64))
  (gpa uint)
  (institution (string-ascii 64))
)
  (begin
    ;; Check if caller is a verifier
    (asserts! (is-verifier tx-sender) (err ERR-UNAUTHORIZED))

    ;; Check if student is not already verified
    (asserts! (not (get verified (get-student-info student))) (err ERR-ALREADY-VERIFIED))

    ;; Validate GPA (assuming GPA is stored as an integer multiplied by 100, e.g., 3.75 = 375)
    (asserts! (<= gpa u400) (err ERR-INVALID-DATA))

    ;; Set student as verified
    (map-set students student {
      verified: true,
      academic-id: academic-id,
      gpa: gpa,
      institution: institution,
      verification-block: block-height
    })

    (ok true)
  )
)

(define-public (update-student-info
  (student principal)
  (gpa uint)
  (institution (string-ascii 64))
)
  (let (
    (student-info (get-student-info student))
  )
    ;; Check if caller is a verifier
    (asserts! (is-verifier tx-sender) (err ERR-UNAUTHORIZED))

    ;; Check if student is already verified
    (asserts! (get verified student-info) (err ERR-INVALID-DATA))

    ;; Validate GPA
    (asserts! (<= gpa u400) (err ERR-INVALID-DATA))

    ;; Update student info
    (map-set students student {
      verified: true,
      academic-id: (get academic-id student-info),
      gpa: gpa,
      institution: institution,
      verification-block: block-height
    })

    (ok true)
  )
)

