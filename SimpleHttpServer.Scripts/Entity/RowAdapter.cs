using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using LyxFramework.Data;
using LyxFramework.Data.Command;
using LyxFramework.Jsons;

namespace SimpleHttpServer.Scripts.Entity
{
    public abstract class RowAdapter
    {
        private static ConcurrentDictionary<Type, long> _mkv = new ConcurrentDictionary<Type, long>();
        private static Func<Type, long, long> _mUpdateFactory = (key, old) => old + 1;
        private SaveUsage _saveUsage;
        
        [JsonMember]
        [EntityColumn(IsPrimary = true)]
        public virtual long ID { get; protected set; }

        public static void LoadPrimary(ISchemaView view)
        {
            if (view == null)
                throw new ArgumentNullException(nameof(view));

            IDbProvider dbProvider;
            if (!DbFactory.TryGet(view.ConnectKey, out dbProvider))
                throw new InvalidOperationException("not found DbProvider:" + view.ConnectKey);

            var str = string.Format("Select IsNull(Max([ID]), 0) From [{0}]", view.Name);
            var obj = dbProvider.ExecuteScalar(str);
            var maxPrimary = Convert.ToInt64(obj);
            _mkv[view.EntityType] = maxPrimary;
        }
        public static long NewID<T>()
        {
            return _mkv.AddOrUpdate(typeof(T), 1, _mUpdateFactory);
        }
        public static T Create<T>()
            where T : RowAdapter, new()
        {
            var obj = Activator.CreateInstance<T>();
            obj._saveUsage = SaveUsage.Insert;
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
                row._saveUsage = SaveUsage.Update;
                row.Initialize();
            }
            return rows;
        }
        public static List<T> Load<T>(IDbProvider dbProvider, Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            if (dbProvider == null)
                throw new ArgumentNullException(nameof(dbProvider));

            ISchemaView view;
            if (!EntitySchemaSet.TryGetView<T>(out view))
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

            ISchemaView view;
            if (!EntitySchemaSet.TryGetView<T>(out view))
                throw new ArgumentException(string.Format("not found {0}:{1}", nameof(ISchemaView), typeof(T).FullName));

            IDbProvider dbProvider;
            if (!DbFactory.TryGet(view.ConnectKey, out dbProvider))
                throw new InvalidOperationException("not found DbProvider:" + view.ConnectKey);

            return Load<T>(dbProvider, commandStruct);
        }
        public static List<T> Load<T>(Expression<Func<T, bool>> condition = null)
            where T : RowAdapter, new()
        {
            ISchemaView view;
            if (!EntitySchemaSet.TryGetView<T>(out view))
                throw new ArgumentException(string.Format("not found {0}:{1}", nameof(ISchemaView), typeof(T).FullName));

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
            ISchemaView view;
            if (!EntitySchemaSet.TryGetView(GetType(), out view))
                throw new ArgumentException();

            IDbProvider dbProvider;
            if (!DbFactory.TryGet(view.ConnectKey, out dbProvider))
                throw new InvalidOperationException("not found DbProvider:" + view.ConnectKey);

            switch (_saveUsage)
            {
                case SaveUsage.Unknown:
                    throw new InvalidOperationException("Unknown SaveUsage");
                case SaveUsage.Update:
                    DbHelper.Update(dbProvider, new object[] { this });
                    break;
                case SaveUsage.Insert:
                    DbHelper.Insert(dbProvider, new object[] { this });
                    break;
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
