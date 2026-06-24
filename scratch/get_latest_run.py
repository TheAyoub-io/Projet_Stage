import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Fetch recent runs
url = "https://api.github.com/repos/TheAyoub-io/Projet_Stage/actions/runs"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
        data = json.loads(response.read().decode())
        runs = data.get("workflow_runs", [])
        if not runs:
            print("No runs found.")
        else:
            for run in runs[:5]:
                print(f"Run ID: {run.get('id')} | Event: {run.get('event')} | Status: {run.get('status')} | Conclusion: {run.get('conclusion')} | Commit: {run.get('head_commit', {}).get('message')}")
            
            # Select the latest run
            latest_run = runs[0]
            run_id = latest_run.get("id")
            print(f"\nFetching jobs for the latest Run ID: {run_id}...")
            
            jobs_url = f"https://api.github.com/repos/TheAyoub-io/Projet_Stage/actions/runs/{run_id}/jobs"
            jobs_req = urllib.request.Request(jobs_url, headers={'User-Agent': 'Mozilla/5.0'})
            
            with urllib.request.urlopen(jobs_req, context=ctx, timeout=15) as jobs_resp:
                jobs_data = json.loads(jobs_resp.read().decode())
                jobs = jobs_data.get("jobs", [])
                for job in jobs:
                    print(f"\nJob Name: {job.get('name')} | Conclusion: {job.get('conclusion')}")
                    if job.get('conclusion') == 'failure' or True: # fetch for any/all
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
                                lines = log_text.split('\n')
                                print(f"--- LOG START (Last 150 lines of {len(lines)} total lines) ---")
                                for line in lines[-150:]:
                                    print(line)
                                print("--- LOG END ---")
                        except Exception as log_err:
                            print(f"Error fetching logs for job {job_id}: {log_err}")
except Exception as e:
    print(f"Error: {e}")
