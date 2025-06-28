// Temporary fix to restore authentication
export function restoreAuth() {
  // Set the working token for user 999 (maxlamenace)
  const workingToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjk5OSwiaWF0IjoxNzUxMDg2Mjc1LCJleHAiOjE3NTE2OTEwNzV9.VS4pE8ziJFS-lG3iQkGx51PoF2Fzc82wHsq2dDYvfUM";
  
  localStorage.setItem('authToken', workingToken);
  localStorage.setItem('token', workingToken);
  
  console.log('Authentication restored for user 999 (maxlamenace)');
  
  // Force page reload to apply authentication
  window.location.reload();
}