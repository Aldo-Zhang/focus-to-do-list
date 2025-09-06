use tauri_plugin_sql::{Builder, Migration, MigrationKind};
use tauri_plugin_cli::CliExt;
use tauri_plugin_http::init as init_http;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    Migration {
      version: 1,
      description: "create_initial_tables",
      sql: r#"
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title_raw TEXT NOT NULL,
          title_rewrite TEXT NOT NULL,
          due TEXT,
          created_at TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('todo', 'done')),
          priority_ai INTEGER NOT NULL CHECK (priority_ai >= 0 AND priority_ai <= 3),
          priority_user INTEGER CHECK (priority_user >= 0 AND priority_user <= 3),
          score REAL NOT NULL DEFAULT 0,
          tags TEXT NOT NULL DEFAULT '[]',
          pinned INTEGER NOT NULL DEFAULT 0
        )
      "#,
      kind: MigrationKind::Up,
    }
  ];

  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:focuslist.db", migrations)
        .build()
    )
    .plugin(tauri_plugin_cli::init())
    .plugin(init_http())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // 处理 CLI 参数
      match app.cli().matches() {
        Ok(matches) => {
          println!("CLI matches: {:?}", matches);
          
          // 处理子命令
          if let Some(subcommand) = matches.subcommand {
            match subcommand.name.as_str() {
              "task" => {
                handle_task_command(&subcommand);
              }
              _ => {
                println!("Unknown subcommand: {}", subcommand.name);
              }
            }
          }
        }
        Err(e) => {
          eprintln!("Error parsing CLI arguments: {}", e);
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

fn handle_task_command(subcommand: &tauri_plugin_cli::SubcommandMatches) {
  println!("处理任务命令: {}", subcommand.name);
  
  // 检查参数
  if subcommand.matches.args.contains_key("add") {
    if let Some(task_text) = subcommand.matches.args.get("add") {
      println!("添加任务: {}", task_text.value);
      // 这里可以调用数据库操作来添加任务
    }
  }
  
  if subcommand.matches.args.contains_key("list") {
    println!("列出所有任务");
    // 这里可以调用数据库操作来列出任务
  }
  
  if subcommand.matches.args.contains_key("complete") {
    if let Some(task_id) = subcommand.matches.args.get("complete") {
      println!("完成任务: {}", task_id.value);
      // 这里可以调用数据库操作来完成任务
    }
  }
}
