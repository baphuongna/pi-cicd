import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { ciStatusHandler } from "../tools/ci_status.ts";

/**
 * Register pi-cicd hooks and commands.
 *
 * Currently registers `/ci` for CI status reporting. Additional CI lifecycle
 * hooks (canary deploy, landing queue, etc.) can be wired here as the
 * extension grows.
 */
export function registerPiCicd(pi: ExtensionAPI): void {
	pi.registerCommand("ci", {
		description: "CI/CD status command. Reports on active runs and pipelines.",
		handler(args: string, _cmdCtx: ExtensionCommandContext) {
			return ciStatusHandler(args);
		},
	});
}
