INSERT INTO public.m365_integration_config (key, value, description) VALUES
  ('opslog.enabled', 'true', 'Master toggle for OpsLog cross-wiring from teams/word/powerpoint functions. Set to "false" to short-circuit appendOpsLog without redeploying.'),
  ('opslog.file_path', 'Groundpath/Logs/ops.xlsx', 'OneDrive path to the OpsLog workbook (relative to /me/drive/root).'),
  ('opslog.table_name', 'OpsLog', 'Excel Table name within the OpsLog workbook to which audit rows are appended.')
ON CONFLICT (key) DO NOTHING;