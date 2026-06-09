type LogStack = 'frontend'; 

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

type LogPackage = 
  | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style' 
  | 'auth' | 'config' | 'middleware' | 'utils';              

export async function Log(
  stack: LogStack,
  level: LogLevel,
  packageName: LogPackage,
  message: string
): Promise<void> {
  const url = 'http://4.224.186.213/evaluation-service/logs';
  
  // Create payload strictly converting keys to lowercase as required by rules
  const payload = {
    stack: stack.toLowerCase(),
    level: level.toLowerCase(),
    package: packageName.toLowerCase(),
    message: message
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Pass the authorization bearer token you generated in Phase 2
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJ2ZWRhbnNoLjIzYjE1MzExNjNAYWJlcy5hYy5pbiIsImV4cCI6MTc4MDk4NTIxMSwiaWF0IjoxNzgwOTg0MzExLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiZWQ0NmEyNTItNGE2Yy00NGY5LTljNTMtYTA3MjYwNTI0ZmM2IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoidmVkYW5zaCBzaW5naCIsInN1YiI6IjIyNjc1NzkwLWY2NmItNDVlMC04YjQ3LTk5YjM3Y2VkMjhjZiJ9LCJlbWFpbCI6InZlZGFuc2guMjNiMTUzMTE2M0BhYmVzLmFjLmluIiwibmFtZSI6InZlZGFuc2ggc2luZ2giLCJyb2xsTm8iOiIyMzAwMzIxNTMwMjAzIiwiYWNjZXNzQ29kZSI6ImNYdXFodCIsImNsaWVudElEIjoiMjI2NzU3OTAtZjY2Yi00NWUwLThiNDctOTliMzdjZWQyOGNmIiwiY2xpZW50U2VjcmV0IjoicXdIR3l2R2ZDd2ZaeWZQYSJ9.RMzfpViD_hOy0F-k1ZXgkNw2PhvukZx4T8SW89L8t_I'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Log recorded successfully. Log ID:', result.logID);
    } else {
      console.error('Failed to dispatch log status:', response.statusText);
    }
  } catch (error) {
    console.error('Network error while dispatching logs:', error);
  }
}