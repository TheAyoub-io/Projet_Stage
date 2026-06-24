import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

run_id = "28110106521"
url = f"https://api.github.com/repos/TheAyoub-io/Projet_Stage/actions/runs/{run_id}/jobs"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
        data = json.loads(response.read().decode())
        jobs = data.get("jobs", [])
        for job in jobs:
            print(f"Job Name: {job.get('name')}")
            print(f"Job ID: {job.get('id')}")
            print(f"Conclusion: {job.get('conclusion')}")
            
            # Fetch logs for the job
            job_id = job.get('id')
            log_url = f"https://api.github.com/repos/TheAyoub-io/Projet_Stage/actions/jobs/{job_id}/logs"
            log_req = urllib.request.Request(log_url, headers={
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'application/vnd.github.v3.raw'
            })
            print(f"Fetching logs from {log_url}...")
            try:
                with urllib.request.urlopen(log_req, context=ctx, timeout=15) as log_resp:
                    log_text = log_resp.read().decode('utf-8')
                    # Print the last 100 lines of the log
                    lines = log_text.split('\n')
                    print(f"--- LOG START (Last 100 lines of {len(lines)} total lines) ---")
                    for line in lines[-100:]:
                        print(line)
                    print("--- LOG END ---")
            except Exception as log_err:
                print(f"Error fetching logs for job {job_id}: {log_err}")
except Exception as e:
    print(f"Error: {e}")
