// fetch OTP from dev API
const email = EMAIL
const response = http.get(`http://localhost:8081/api/dev/get-otp?email=${encodeURIComponent(email)}`)
const data = JSON.parse(response.body)
output.otp = data.otp
