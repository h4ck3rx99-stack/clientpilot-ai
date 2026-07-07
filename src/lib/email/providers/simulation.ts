import { EmailProvider, EmailProviderName, EmailSendInput, EmailSendResult } from "./types";

export class SimulationProvider implements EmailProvider {
  name: EmailProviderName = "simulation";

  isConfigured(): boolean {
    return true;
  }

  async sendEmail(_input: EmailSendInput): Promise<EmailSendResult> {
    return {
      success: true,
      provider: "simulation",
    };
  }
}
