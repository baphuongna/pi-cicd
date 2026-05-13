/**
 * Command Registry Pattern
 * 
 * Registry for command handlers with validation and aliases.
 * 
 * Inspired by gstack and pi-hermes-memory patterns.
 */

export interface CommandDefinition<T = unknown> {
  /** Command name (e.g., "deploy", "ci-status") */
  name: string;
  /** Short description */
  description?: string;
  /** Longer description */
  help?: string;
  /** Aliases for the command */
  aliases?: string[];
  /** Parameter schema */
  params?: T;
  /** Examples for help */
  examples?: Array<{ cmd: string; desc: string }>;
}

export interface CommandHandler<T = unknown> {
  /** Execute the command */
  execute(params: T, context: CommandContext): Promise<CommandResult>;
  /** Validate parameters before execution */
  validate?(params: T): ValidationResult;
}

export interface CommandContext {
  /** Current working directory */
  cwd: string;
  /** User environment */
  env: Record<string, string>;
  /** Logger */
  log: Logger;
  /** Config store */
  config: ConfigStore;
}

export interface CommandResult {
  /** Exit code (0 = success) */
  code: number;
  /** Output to stdout */
  output?: string;
  /** Output to stderr */
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug(msg: string): void;
}

export interface ConfigStore {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set<T>(key: string, value: T): void;
}

/**
 * Command registry for managing available commands.
 */
export class CommandRegistry {
  private commands = new Map<string, CommandHandler>();
  private definitions = new Map<string, CommandDefinition>();
  private aliases = new Map<string, string>();

  /**
   * Register a command.
   */
  register<T = unknown>(
    definition: CommandDefinition<T>,
    handler: CommandHandler<T>
  ): void {
    this.commands.set(definition.name, handler as CommandHandler);
    this.definitions.set(definition.name, definition);

    // Register aliases
    for (const alias of definition.aliases ?? []) {
      this.aliases.set(alias, definition.name);
    }
  }

  /**
   * Execute a command by name.
   */
  async execute(
    name: string,
    params: unknown,
    context: CommandContext
  ): Promise<CommandResult> {
    // Resolve alias
    const resolved = this.aliases.get(name) ?? name;

    // Find command
    const handler = this.commands.get(resolved);
    if (!handler) {
      return {
        code: 1,
        error: `Unknown command: ${name}`,
      };
    }

    // Validate
    if (handler.validate) {
      const validation = handler.validate(params);
      if (!validation.valid) {
        return {
          code: 1,
          error: `Validation failed: ${validation.errors?.join(", ")}`,
        };
      }
    }

    // Execute
    try {
      return await handler.execute(params, context);
    } catch (error) {
      return {
        code: 1,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get command definition.
   */
  getDefinition(name: string): CommandDefinition | undefined {
    const resolved = this.aliases.get(name) ?? name;
    return this.definitions.get(resolved);
  }

  /**
   * List all command names.
   */
  listCommands(): string[] {
    return Array.from(this.definitions.keys()).sort();
  }

  /**
   * Get help text for a command.
   */
  getHelp(name: string): string | undefined {
    const def = this.getDefinition(name);
    if (!def) return undefined;

    let help = `# ${def.name}`;
    if (def.aliases?.length) {
      help += ` (alias: ${def.aliases.join(", ")})`;
    }
    help += "\n\n";

    if (def.description) {
      help += `${def.description}\n\n`;
    }

    if (def.help) {
      help += `${def.help}\n\n`;
    }

    if (def.examples?.length) {
      help += "## Examples\n\n";
      for (const ex of def.examples) {
        help += `\`${ex.cmd}\`\n${ex.desc}\n\n`;
      }
    }

    return help;
  }
}

/**
 * Create a command registry.
 */
export function createCommandRegistry(): CommandRegistry {
  return new CommandRegistry();
}
