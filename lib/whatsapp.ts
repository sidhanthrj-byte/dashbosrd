export function getWhatsAppUrl(
  phone: string,
  name: string,
  company: string,
  status: string,
  projectType?: string | null
): string {
  const message = getTemplate(status, name.split(' ')[0], company, projectType);
  if (!phone || phone === '0') {
    // No phone — return compose URL (WhatsApp will prompt user to pick contact)
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  }
  const cleaned = phone.replace(/\D/g, '');
  const withCode = cleaned.startsWith('91') && cleaned.length >= 12 ? cleaned : `91${cleaned}`;
  return `https://wa.me/${withCode}?text=${encodeURIComponent(message)}`;
}

function getTemplate(status: string, name: string, company: string, projectType?: string | null): string {
  const pt = projectType || 'architectural';

  const templates: Record<string, string> = {
    new: `Hi ${name}! 👋 I'm Sidhanth from *Pongs Stretch Ceiling*.\n\nWe create premium stretch ceiling solutions that are perfect for ${pt} projects. I'd love to show you what we've done for leading architects across India.\n\nAre you free for a quick 5-min call this week? 🏗️`,

    first_call_done: `Hi ${name}! Great speaking with you just now. 😊\n\nAs discussed, I'm sending over our *Pongs Stretch Ceiling* portfolio and case studies relevant to ${company}'s work.\n\nDo let me know if you'd like physical samples sent over too!`,

    call_back_requested: `Hi ${name}, hope you're doing well! 🙏\n\nThis is Sidhanth from *Pongs Stretch Ceiling* — following up as we had discussed. Would now be a good time for a quick chat?\n\nLooking forward to connecting!`,

    follow_up: `Hi ${name}! Sidhanth from *Pongs Stretch Ceiling* here. 👋\n\nJust checking in on our earlier conversation — have you had a chance to look at our catalogue?\n\nWe have some new finishes that I think would work beautifully for ${company}'s projects. Happy to answer any questions! 🎨`,

    meeting_scheduled: `Hi ${name}, looking forward to our meeting! 🤝\n\nI'll be bringing:\n✅ Full *Pongs Stretch Ceiling* sample set\n✅ Portfolio relevant to your projects\n✅ Pricing & customisation options\n\nAny specific project you'd like me to focus on? See you soon!`,

    proposal_sent: `Hi ${name}, hope you've had a chance to go through the *Pongs Stretch Ceiling* proposal I shared. 📋\n\nWould love to hear your thoughts! Happy to:\n• Adjust specifications\n• Provide alternate pricing\n• Arrange a sample viewing\n\nJust let me know! 😊`,

    negotiation: `Hi ${name}! 💼\n\nThank you for your continued interest in *Pongs Stretch Ceiling*.\n\nI'm working on getting you the best possible package for ${company}. Can we hop on a quick call to finalise the details? I have some exciting options to share!`,

    sample_sent: `Hi ${name}! 🎨\n\nJust checking in — have you received the *Pongs Stretch Ceiling* samples?\n\nWould love to hear your thoughts on the quality and finish! We also have additional textures/colours if you'd like to explore more options.`,

    converted: `Hi ${name}! 🎉\n\nThank you so much for choosing *Pongs Stretch Ceiling* for ${company}!\n\nWe're excited to work together. I'll have the order confirmation and installation timeline sent to you shortly.\n\nLooking forward to a fantastic project! 🏗️✨`,

    not_interested: `Hi ${name}, completely understand — no worries at all! 🙏\n\nI'll be in touch again in a few months as our product line evolves. Hope we get an opportunity to work together sometime!\n\nTake care! 😊`,

    on_hold: `Hi ${name}, hope all is well! 👋\n\nJust a gentle check-in from *Pongs Stretch Ceiling*. Has anything changed on your end that we can assist with?\n\nHappy to revisit our discussion whenever you're ready!`,
  };

  return templates[status] || templates['new'];
}
