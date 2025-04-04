;; Donor Management Contract
;; Records contributions to scholarship funds

;; Define data variables
(define-data-var total-donations uint u0)
(define-map donors principal {total-donated: uint, last-donation-block: uint})
(define-map scholarship-funds (string-ascii 64) {balance: uint, donors-count: uint})

;; Error codes
(define-constant ERR-UNAUTHORIZED u401)
(define-constant ERR-INVALID-AMOUNT u402)
(define-constant ERR-FUND-NOT-FOUND u404)

;; Read-only functions
(define-read-only (get-total-donations)
  (var-get total-donations)
)

(define-read-only (get-donor-info (donor principal))
  (default-to {total-donated: u0, last-donation-block: u0} (map-get? donors donor))
)

(define-read-only (get-fund-info (fund-name (string-ascii 64)))
  (default-to {balance: u0, donors-count: u0} (map-get? scholarship-funds fund-name))
)

;; Public functions
(define-public (donate (fund-name (string-ascii 64)) (amount uint))
  (let (
    (fund (default-to {balance: u0, donors-count: u0} (map-get? scholarship-funds fund-name)))
    (donor-info (default-to {total-donated: u0, last-donation-block: u0} (map-get? donors tx-sender)))
    (is-new-donor (is-eq (get total-donated donor-info) u0))
  )
    ;; Check if amount is valid
    (asserts! (> amount u0) (err ERR-INVALID-AMOUNT))

    ;; Update total donations
    (var-set total-donations (+ (var-get total-donations) amount))

    ;; Update donor info
    (map-set donors tx-sender {
      total-donated: (+ (get total-donated donor-info) amount),
      last-donation-block: block-height
    })

    ;; Update fund info
    (map-set scholarship-funds fund-name {
      balance: (+ (get balance fund) amount),
      donors-count: (if is-new-donor
                      (+ (get donors-count fund) u1)
                      (get donors-count fund))
    })

    (ok amount)
  )
)

(define-public (create-fund (fund-name (string-ascii 64)))
  (let (
    (fund-exists (is-some (map-get? scholarship-funds fund-name)))
  )
    (asserts! (not fund-exists) (err ERR-FUND-NOT-FOUND))

    (map-set scholarship-funds fund-name {
      balance: u0,
      donors-count: u0
    })

    (ok true)
  )
)
