using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using Framework.Data;
using Framework.Data.Command;
using Framework.JavaScript;

namespace SimpleHttpServer.Scripts.Entity
{
    public abstract class RowAdapter
    {
        private static ConcurrentDictionary<Type, long> mkv = new ConcurrentDictionary<Type, long>();
        private static Func<Type, long, long> mUpdateFactory = (key, old) => old + 1;
        private SaveUsage saveUsage;
        
        [JsonMember]
        [EntityColumn(IsPrimary = true)]
        public virtual long ID { get; protected set; }

        public static void LoadPrimary(IEntitySchema entitySchema)
        {
            if (entitySchema == null)
                throw new ArgumentNullException(nameof(entitySchema));

            IDbProvider dbProvider;
            if (!DbFactory.TryGet(entitySchema.ConnectKey, out dbProvider))
                throw new InvalidOperationException("not found DbProvider:" + entitySchema.ConnectKey);

            var str = string.Format("Select IsNull(Max([ID]), 0) From [{0}]", entitySchema.Name);
            var obj = dbProvider.ExecuteScalar(str);
            var maxPrimary = Convert.ToInt64(obj);
            mkv[entitySchema.EntityType] = maxPrimary;
        }

        public static long NewID<T>()
        {
            return mkv.AddOrUpdate(typeof(T), 1, mUpdateFactory);
        }

        public static T Create<T>()
            where T : RowAdapter, new()
        {
            var obj = Activator.CreateInstance<T>();
            obj.saveUsage = SaveUsage.Insert;
            obj.ID = RowAdapter.NewID<T>();
            obj.CreateSuccess();
            obj.Initialize();
            return obj;
        }

        public static List<T> Load<T>(IDbProvider dbProvider, IDbCommandStruct commandStruct)
            where T : RowAdapter, new()
        {
            if (dbProvider == null)
                throw new ArgumentNullException(nameof(dbProvider));
            if (commandStruct == null)
                throw new ArgumentNullException(nameof(commandStruct));

            var rows = DbHelper.Load<T>(dbProvider, commandStruct);
            foreach (var row in rows)
            {
                row.saveUsage = SaveUsage.Update;
                row.Initialize();
            }
            return rows;
        }

        public static List<T> Load<T>(IDbProvider dbProvider, Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            if (dbProvider == null)
                throw new ArgumentNullException(nameof(dbProvider));
            if (!EntitySchemaManager.TryGetSchema<T>(out IEntitySchema view))
                throw new ArgumentException();

            var commandStruct = dbProvider.CreateCommand<T>(view.Name, DbCommandMode.Select, view.Columns);
            if (condition != null)
            {
                commandStruct.Where(condition);
            }
            return Load<T>(dbProvider, commandStruct);
        }

        public static List<T> Load<T>(IDbCommandStruct commandStruct)
            where T : RowAdapter, new()
        {
            if (commandStruct == null)
                throw new ArgumentNullException(nameof(commandStruct));
            if (!EntitySchemaManager.TryGetSchema<T>(out IEntitySchema view))
                throw new ArgumentException(string.Format("not found {0}:{1}", nameof(IEntitySchema), typeof(T).FullName));

            IDbProvider dbProvider;
            if (!DbFactory.TryGet(view.ConnectKey, out dbProvider))
                throw new InvalidOperationException("not found DbProvider:" + view.ConnectKey);

            return Load<T>(dbProvider, commandStruct);
        }

        public static List<T> Load<T>(Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            if (!EntitySchemaManager.TryGetSchema<T>(out IEntitySchema view))
                throw new ArgumentException(string.Format("not found {0}:{1}", nameof(IEntitySchema), typeof(T).FullName));

            IDbProvider dbProvider;
            if (!DbFactory.TryGet(view.ConnectKey, out dbProvider))
                throw new InvalidOperationException("not found DbProvider:" + view.ConnectKey);

            return Load<T>(dbProvider, condition);
        }

        public static T LoadFirst<T>(Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            return Load<T>(condition).First();
        }

        public static T LoadFirstOrDefault<T>(Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            return Load<T>(condition).FirstOrDefault();
        }

        public static T LoadSingle<T>(Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            return Load<T>(condition).Single();
        }

        public static T LoadSingleOrDefault<T>(Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            return Load<T>(condition).SingleOrDefault();
        }

        public void Save()
        {
            if (!EntitySchemaManager.TryGetSchema(GetType(), out IEntitySchema view))
                throw new ArgumentException();
            if (!DbFactory.TryGet(view.ConnectKey, out IDbProvider dbProvider))
                throw new InvalidOperationException("not found DbProvider:" + view.ConnectKey);

            switch (saveUsage)
            {
                case SaveUsage.Update:
                    DbHelper.Update(dbProvider, new object[] { this });
                    break;
                case SaveUsage.Insert:
                    DbHelper.Insert(dbProvider, new object[] { this });
                    break;
                default:
                    throw new InvalidOperationException(string.Format("unknown {0}:{1}", nameof(SaveUsage), saveUsage));
            }
        }

        protected virtual void CreateSuccess()
        { }

        protected virtual void Initialize()
        { }
    }
    public enum SaveUsage
    {
        Unknown,
        Update,
        Insert,
    }
}
