-- 003_seed_templates.sql — Starter email/script templates
-- Idempotent: only inserts if templates table is empty

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM templates LIMIT 1) THEN
    INSERT INTO templates (type, name, subject, body, merge_fields) VALUES
    (
      'email_initial',
      'Initial Business Outreach',
      'Connecting {{business_name}} with Your Local Rotary Club',
      E'Dear {{contact_name}},\n\nI''m reaching out from your local Rotary Club. We''re launching a campaign to connect with businesses in {{city}} and understand how we can support your success.\n\nRotary clubs worldwide are known for community service, but we also believe in strengthening local businesses. We''d love to learn about {{business_name}} and explore ways we might collaborate.\n\nWould you be available for a brief 15-minute conversation this week?\n\nBest regards,\n{{rotary_member_name}}\nRotary Club of {{city}}',
      '{"business_name","contact_name","city","rotary_member_name"}'
    ),
    (
      'email_followup',
      'Follow-Up After Initial Contact',
      'Following Up — Rotary Club & {{business_name}}',
      E'Dear {{contact_name}},\n\nThank you for taking the time to speak with us about {{business_name}}. It was great learning about your business and the work you do in {{city}}.\n\nBased on our conversation, I wanted to follow up on the needs we discussed around {{specific_need}}.\n\nPlease don''t hesitate to reach out if you have any questions. We look forward to building a lasting relationship with {{business_name}}.\n\nWarm regards,\n{{rotary_member_name}}\nRotary Club of {{city}}',
      '{"business_name","contact_name","city","rotary_member_name","specific_need"}'
    ),
    (
      'email_thankyou',
      'Business Needs Assessment',
      'How Can Rotary Support {{business_name}}?',
      E'Dear {{contact_name}},\n\nAs part of our ongoing partnership with local businesses, we''d like to understand the current needs and challenges facing {{business_name}}.\n\nOur club members have expertise in areas like:\n- Networking and business referrals\n- Community advertising opportunities\n- Professional development and training\n- Technology guidance\n- Mentorship programs\n\nWould any of these be valuable for {{business_name}}? We''d love to schedule a brief needs assessment to see how Rotary can make a difference.\n\nBest,\n{{rotary_member_name}}\nRotary Club of {{city}}',
      '{"business_name","contact_name","city","rotary_member_name"}'
    ),
    (
      'script_bltr',
      'Cold Call Introduction Script',
      NULL,
      E'Hi, may I speak with {{contact_name}}?\n\n[If available]\nHi {{contact_name}}, my name is {{rotary_member_name}} and I''m a member of the Rotary Club of {{city}}. We''re reaching out to local businesses to introduce ourselves and learn how Rotary might support businesses like {{business_name}}.\n\nDo you have about 2 minutes?\n\n[If yes]\nGreat! Rotary is known for community service, but we also focus on supporting local businesses through networking, referrals, and community partnerships. We''re currently meeting with business owners in the area to understand their needs.\n\nWould you be open to a brief in-person visit or meeting sometime this week?\n\n[If no / busy]\nNo problem at all. Would it be okay if I sent you a brief email with more information? What''s the best email address to reach you?\n\nThank you for your time, {{contact_name}}!',
      '{"business_name","contact_name","city","rotary_member_name"}'
    ),
    (
      'script_tcc',
      'Follow-Up Call Script',
      NULL,
      E'Hi {{contact_name}}, this is {{rotary_member_name}} from the Rotary Club of {{city}}.\n\nI''m following up on our previous conversation about {{business_name}}. I wanted to check in and see if you had any questions about the ways Rotary can support your business.\n\n[If they express interest]\nThat''s great to hear! Based on what you''ve told me, I think we could help with {{specific_need}}. Would you be interested in learning more?\n\n[If they need more time]\nAbsolutely, take your time. I''ll send you some additional information by email. Is {{email}} still the best address?\n\nThank you, {{contact_name}}. Looking forward to working together!',
      '{"business_name","contact_name","city","rotary_member_name","specific_need","email"}'
    ),
    (
      'script_phone',
      'In-Person Visit Script',
      NULL,
      E'[Arrival — introduce yourself]\nHi, I''m {{rotary_member_name}} from the Rotary Club of {{city}}. Thank you for taking the time to meet with us today!\n\n[Opening]\nAs I mentioned, our Rotary Club is connecting with businesses in the community to learn about your needs and explore partnership opportunities.\n\n[Discovery Questions]\n1. How long has {{business_name}} been operating in {{city}}?\n2. What are the biggest challenges facing your business right now?\n3. Are there specific areas where community support would make a difference?\n4. Have you worked with community organizations before?\n5. What would an ideal partnership look like for {{business_name}}?\n\n[Wrap Up]\nThank you for sharing all of this. I''ll put together a summary of what we discussed and reach out with some specific ways Rotary can help.\n\n[Leave behind: Rotary brochure, your business card]',
      '{"business_name","contact_name","city","rotary_member_name"}'
    );
  END IF;
END $$;
